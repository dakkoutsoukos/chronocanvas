// Monthly content rotation:
//   1. Graduates whatever was in current-month.json (this month's
//      daily-exclusive pieces) into the permanent archive — they've all
//      been played as dailies by now, so they're fair game for unlimited
//      mode and the searchable archive.
//   2. Pulls a fresh batch of never-before-used pieces from the museum
//      APIs, one 5-piece set per remaining day in the current UTC month,
//      and writes them to a new current-month.json. Those stay hidden
//      from unlimited mode / the archive until *next* rotation graduates
//      them — that's what keeps each day's daily from being spoilable by
//      someone playing unlimited mode first.
//
// Always targets "today through the end of the current UTC month," which
// means it does the right thing whether it's run by the scheduled job on
// the 1st (covers the whole month) or run by hand mid-month (covers the
// remaining days, e.g. for an initial rollout).
//
// Run with: node scripts/rotate-monthly.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCollector, shuffle } from './lib/collector.mjs';
import { fetchAIC, fetchCMA, fetchMet } from './lib/museums.mjs';
import { rebalanceByCentury } from './lib/rebalance.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVE_PATH = path.join(__dirname, '../src/lib/data/archive.json');
const CURRENT_MONTH_PATH = path.join(__dirname, '../src/lib/data/current-month.json');

const BUFFER = 1.4; // fetch a bit more than needed in case some candidates get filtered out downstream

async function readJson(filePath, fallback) {
	try {
		return JSON.parse(await readFile(filePath, 'utf-8'));
	} catch {
		return fallback;
	}
}

function pad(n) {
	return String(n).padStart(2, '0');
}

async function main() {
	const archive = await readJson(ARCHIVE_PATH, []);
	const currentMonth = await readJson(CURRENT_MONTH_PATH, {});

	// 1. Graduate last rotation's exclusive pieces into the permanent archive.
	const graduated = Object.values(currentMonth).flat();
	const archiveIds = new Set(archive.map((a) => a.id));
	let graduatedCount = 0;
	for (const work of graduated) {
		if (archiveIds.has(work.id)) continue;
		archive.push(work);
		archiveIds.add(work.id);
		graduatedCount++;
	}
	console.log(`Graduated ${graduatedCount} pieces into the archive (now ${archive.length} total).`);

	// 2. Figure out which dates need a fresh set this run.
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth(); // 0-indexed
	const todayDate = now.getUTCDate();
	const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const dates = [];
	for (let d = todayDate; d <= lastDayOfMonth; d++) {
		dates.push(`${year}-${pad(month + 1)}-${pad(d)}`);
	}
	const totalNeeded = dates.length * 5;
	console.log(`Targeting ${dates.length} day(s) (${dates[0]}..${dates[dates.length - 1]}), ${totalNeeded} pieces needed.`);

	// 3. Pull fresh, never-before-used candidates.
	const collector = createCollector({ excludeIds: archiveIds, maxPerArtist: 2 });
	await fetchAIC({ targetCount: Math.ceil(totalNeeded * 0.45 * BUFFER), addWork: collector.addWork });
	await fetchCMA({ targetCount: Math.ceil(totalNeeded * 0.45 * BUFFER), addWork: collector.addWork });
	await fetchMet({ targetCount: Math.ceil(totalNeeded * 0.2 * BUFFER), addWork: collector.addWork });

	const balanced = rebalanceByCentury(collector.items, {
		maxPerCentury: Math.max(10, Math.ceil(totalNeeded * 0.35)),
		maxPerCenturyTopup: totalNeeded,
		finalTarget: totalNeeded
	});
	const pool = shuffle(balanced);

	const coverableDays = Math.min(dates.length, Math.floor(pool.length / 5));
	if (coverableDays < dates.length) {
		console.warn(
			`Only found enough fresh candidates for ${coverableDays}/${dates.length} days. ` +
				`Remaining days will fall back to the reshuffled-archive daily pick.`
		);
	}

	// 4. Assign 5 pieces per day. Only fully-covered days go in — a
	// partially-covered final day would leak year info to the next day's
	// daily player (still visible in the file), so leave it out entirely.
	const newCurrentMonth = {};
	for (let i = 0; i < coverableDays; i++) {
		newCurrentMonth[dates[i]] = pool.slice(i * 5, i * 5 + 5);
	}

	await mkdir(path.dirname(ARCHIVE_PATH), { recursive: true });
	await writeFile(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
	await writeFile(CURRENT_MONTH_PATH, JSON.stringify(newCurrentMonth, null, 2));
	console.log(`Wrote ${archive.length}-piece archive and ${coverableDays}-day current-month batch.`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
