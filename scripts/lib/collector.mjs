// Shared de-duplication/filtering state used while pulling candidate
// artworks from museum APIs. Used both by the one-time initial seed script
// and the monthly rotation script, so "already used anywhere, ever" and
// "no single artist floods the pool" behave identically in both places.

// Strips "(English, 1804-1867)"-style suffixes so the guessing screen never
// leaks the artist's lifespan (which would hand away the answer).
export function cleanArtistName(raw) {
	if (!raw) return 'Unknown artist';
	return raw.replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Unknown artist';
}

export function createCollector({
	excludeIds = new Set(),
	maxPerArtist = 3,
	minYear = 1000,
	maxYear = new Date().getFullYear(),
	minTitleLen = 2
} = {}) {
	const seenKey = new Map();
	const artistCount = new Map();
	const items = [];

	function addWork(work) {
		if (!work.image || !work.title || !work.year) return false;
		if (work.title.length < minTitleLen) return false;
		if (work.year < minYear || work.year > maxYear) return false;
		if (excludeIds.has(work.id)) return false;
		const key = `${work.title.trim().toLowerCase()}::${work.artist.trim().toLowerCase()}`;
		if (seenKey.has(key)) return false;
		const artistKey = work.artist.trim().toLowerCase();
		const count = artistCount.get(artistKey) || 0;
		if (count >= maxPerArtist) return false;
		artistCount.set(artistKey, count + 1);
		seenKey.set(key, true);
		items.push(work);
		return true;
	}

	return { addWork, items };
}

export function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

export function shuffle(array) {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}
