import { shuffle } from './collector.mjs';

// Caps how many works come from any single century so one well-digitized
// era doesn't swamp the pool, then tops back up toward `finalTarget` if
// we're short (round-robin across centuries, so the top-up doesn't just
// recreate the original skew by dumping whichever era had the most overflow).
export function rebalanceByCentury(list, { maxPerCentury, maxPerCenturyTopup, finalTarget }) {
	const buckets = new Map();
	for (const w of list) {
		const c = Math.floor(w.year / 100) * 100;
		if (!buckets.has(c)) buckets.set(c, []);
		buckets.get(c).push(w);
	}
	for (const [century, bucket] of buckets) buckets.set(century, shuffle(bucket));

	const kept = [];
	const overflow = new Map();
	for (const [century, bucket] of buckets) {
		kept.push(...bucket.slice(0, maxPerCentury));
		overflow.set(century, bucket.slice(maxPerCentury));
	}

	let addedMore = true;
	while (kept.length < finalTarget && addedMore) {
		addedMore = false;
		for (const [century, bucket] of overflow) {
			if (kept.length >= finalTarget) break;
			const currentInCentury = kept.filter((w) => Math.floor(w.year / 100) * 100 === century).length;
			if (currentInCentury >= maxPerCenturyTopup) continue;
			const next = bucket.shift();
			if (!next) continue;
			kept.push(next);
			addedMore = true;
		}
	}
	return kept;
}
