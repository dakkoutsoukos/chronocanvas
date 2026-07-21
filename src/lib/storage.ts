import { browser } from '$app/environment';

export type RoundRecord = {
	artworkId: string;
	guessYear: number;
	actualYear: number;
	score: number;
};

export type DailyResult = {
	puzzleNumber: number;
	dateKey: string;
	rounds: RoundRecord[];
	totalScore: number;
	completedAt: string;
};

const HISTORY_KEY = 'chronocanvas:daily-history:v1';
const STREAK_KEY = 'chronocanvas:streak:v1';

type HistoryMap = Record<string, DailyResult>; // dateKey -> result

function readHistory(): HistoryMap {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function writeHistory(map: HistoryMap) {
	if (!browser) return;
	localStorage.setItem(HISTORY_KEY, JSON.stringify(map));
}

export function getDailyResult(dateKey: string): DailyResult | null {
	return readHistory()[dateKey] ?? null;
}

export type Streak = { current: number; best: number; lastDateKey: string | null };

function readStreak(): Streak {
	if (!browser) return { current: 0, best: 0, lastDateKey: null };
	try {
		const raw = localStorage.getItem(STREAK_KEY);
		return raw ? JSON.parse(raw) : { current: 0, best: 0, lastDateKey: null };
	} catch {
		return { current: 0, best: 0, lastDateKey: null };
	}
}

function writeStreak(streak: Streak) {
	if (!browser) return;
	localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

function addDays(dateKey: string, days: number): string {
	const [y, m, d] = dateKey.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	return dt.toISOString().slice(0, 10);
}

export function saveDailyResult(result: DailyResult): Streak {
	const history = readHistory();
	history[result.dateKey] = result;
	writeHistory(history);

	const streak = readStreak();
	if (streak.lastDateKey === result.dateKey) {
		return streak; // already recorded today
	}
	const isConsecutive = streak.lastDateKey !== null && addDays(streak.lastDateKey, 1) === result.dateKey;
	const current = isConsecutive ? streak.current + 1 : 1;
	const updated: Streak = {
		current,
		best: Math.max(current, streak.best),
		lastDateKey: result.dateKey
	};
	writeStreak(updated);
	return updated;
}

export function getStreak(): Streak {
	return readStreak();
}
