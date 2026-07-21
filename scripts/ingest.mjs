// One-time (or re-run-from-scratch) seed of the permanent archive pool from
// open museum APIs (Met, Cleveland Museum of Art, Art Institute of Chicago).
// For ongoing growth, see rotate-monthly.mjs instead — this script rebuilds
// src/lib/data/archive.json from nothing, ignoring whatever's already there.
//
// Run with: node scripts/ingest.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCollector, shuffle } from './lib/collector.mjs';
import { fetchAIC, fetchCMA, fetchMet } from './lib/museums.mjs';
import { rebalanceByCentury } from './lib/rebalance.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/lib/data/archive.json');

const FINAL_TARGET = 500;

async function main() {
	const collector = createCollector({ maxPerArtist: 3 });

	await fetchAIC({ targetCount: 700, addWork: collector.addWork });
	await fetchCMA({ targetCount: 700, addWork: collector.addWork });
	await fetchMet({ targetCount: 300, addWork: collector.addWork });

	console.log(`\nRaw pool before rebalancing: ${collector.items.length}`);
	const balanced = rebalanceByCentury(collector.items, {
		maxPerCentury: 70,
		maxPerCenturyTopup: 140,
		finalTarget: FINAL_TARGET
	});
	const final = shuffle(balanced);

	await mkdir(path.dirname(OUT_PATH), { recursive: true });
	await writeFile(OUT_PATH, JSON.stringify(final, null, 2));
	console.log(`Wrote ${final.length} artworks to ${OUT_PATH}`);

	const years = final.map((a) => a.year).sort((a, b) => a - b);
	console.log(`Year range: ${years[0]}–${years[years.length - 1]}`);
	const centuries = final.reduce((acc, a) => {
		const c = Math.floor(a.year / 100) * 100;
		acc[c] = (acc[c] || 0) + 1;
		return acc;
	}, {});
	console.log('Per century:', centuries);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
