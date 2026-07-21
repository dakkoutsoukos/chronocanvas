export type Artwork = {
	id: string;
	title: string;
	artist: string;
	artistFull: string;
	year: number;
	yearDisplay: string;
	image: string;
	medium: string;
	source: string;
	sourceUrl: string;
	license: string;
};

export const ROUNDS_PER_GAME = 5;
export const MAX_ROUND_SCORE = 5000;
export const MAX_GAME_SCORE = MAX_ROUND_SCORE * ROUNDS_PER_GAME;

// Score halves every HALF_LIFE_YEARS of error, with a small forgiveness
// window since museum dates are themselves often "circa" estimates rather
// than exact years.
export const HALF_LIFE_YEARS = 50;
export const FORGIVENESS_YEARS = 2;

export function scoreRound(guessYear: number, actualYear: number): number {
	const diff = Math.abs(guessYear - actualYear);
	const effective = Math.max(0, diff - FORGIVENESS_YEARS);
	const raw = MAX_ROUND_SCORE * Math.pow(2, -effective / HALF_LIFE_YEARS);
	return Math.round(raw);
}

export type RoundJudgement = 'perfect' | 'close' | 'decent' | 'off' | 'way-off';

export function judgeRound(guessYear: number, actualYear: number): RoundJudgement {
	const diff = Math.abs(guessYear - actualYear);
	if (diff <= FORGIVENESS_YEARS) return 'perfect';
	if (diff <= 15) return 'close';
	if (diff <= 50) return 'decent';
	if (diff <= 120) return 'off';
	return 'way-off';
}

export const JUDGEMENT_LABEL: Record<RoundJudgement, string> = {
	perfect: 'Dead on',
	close: 'Close!',
	decent: 'Not bad',
	off: 'Off the mark',
	'way-off': 'Way off'
};

// --- Seeded RNG (mulberry32) so the daily puzzle is identical for everyone ---
function mulberry32(seed: number): () => number {
	let a = seed;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function hashStringToInt(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
	}
	return hash;
}

/** Calendar day key in UTC, e.g. "2026-07-21". Daily puzzles roll over at 00:00 UTC. */
export function todayKey(date: Date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

const PUZZLE_EPOCH = Date.UTC(2026, 0, 1); // Puzzle #1

export function dailyPuzzleNumber(dateKey: string = todayKey()): number {
	const [y, m, d] = dateKey.split('-').map(Number);
	const utcMs = Date.UTC(y, m - 1, d);
	return Math.floor((utcMs - PUZZLE_EPOCH) / 86_400_000) + 1;
}

/** Map of date key ("2026-08-01") -> that day's 5 pre-assigned, not-yet-graduated artworks. */
export type CurrentMonth = Record<string, Artwork[]>;

/**
 * Today's 5 artworks. Prefers the pre-assigned exclusive set from the
 * current monthly rotation (kept out of unlimited mode / the archive until
 * it graduates, so it can't be spoiled). Falls back to a deterministic
 * reshuffle of the permanent archive if today isn't covered — e.g. the
 * rotation job hasn't run yet, or ran short on fresh candidates for the
 * month. Same archive + same date always reshuffles to the same 5, so the
 * fallback is just as fair/shareable as the real thing.
 */
export function getDailyArtworks(
	archive: Artwork[],
	currentMonth: CurrentMonth = {},
	dateKey: string = todayKey()
): Artwork[] {
	if (currentMonth[dateKey]?.length === ROUNDS_PER_GAME) {
		return currentMonth[dateKey];
	}
	const rng = mulberry32(hashStringToInt(dateKey));
	const pool = [...archive];
	const picks: Artwork[] = [];
	for (let i = 0; i < ROUNDS_PER_GAME && pool.length > 0; i++) {
		const idx = Math.floor(rng() * pool.length);
		picks.push(pool[idx]);
		pool.splice(idx, 1);
	}
	return picks;
}

export function getRandomArtworks(artworks: Artwork[], count = ROUNDS_PER_GAME): Artwork[] {
	const pool = [...artworks];
	const picks: Artwork[] = [];
	for (let i = 0; i < count && pool.length > 0; i++) {
		const idx = Math.floor(Math.random() * pool.length);
		picks.push(pool[idx]);
		pool.splice(idx, 1);
	}
	return picks;
}

export type ScoreTier = {
	label: string;
	blurb: string;
};

export function scoreTier(totalScore: number): ScoreTier {
	const pct = totalScore / MAX_GAME_SCORE;
	if (pct >= 0.9) return { label: 'Art Historian', blurb: 'You could date these with the lights off.' };
	if (pct >= 0.75) return { label: 'Connoisseur', blurb: 'A very well-trained eye.' };
	if (pct >= 0.55) return { label: 'Gallery Regular', blurb: 'You know your centuries.' };
	if (pct >= 0.35) return { label: 'Curious Visitor', blurb: 'Getting the hang of it.' };
	return { label: 'Just Browsing', blurb: 'Every visit starts somewhere.' };
}
