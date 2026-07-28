<script lang="ts">
	import { browser } from '$app/environment';
	import { dailyPuzzleNumber, todayKey } from '$lib/game';
	import { getDailyResult, getStreak } from '$lib/storage';

	// Computed lazily in the browser rather than at module init: this page is
	// prerendered, and "today" must reflect the visitor's real clock, not
	// whatever date the static build happened to run on.
	let puzzleNumber = $state<number | null>(null);
	let alreadyPlayed = $state(false);
	let streak = $state({ current: 0, best: 0, lastDateKey: null as string | null });

	if (browser) {
		const dateKey = todayKey();
		puzzleNumber = dailyPuzzleNumber(dateKey);
		alreadyPlayed = getDailyResult(dateKey) !== null;
		streak = getStreak();
	}
</script>

<svelte:head>
	<title>Chronocanvas — Daily Art History Guessing Game</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
	<div>
		<h1 class="font-display text-5xl font-semibold sm:text-6xl">
			Chrono<span class="text-terracotta-dark">canvas</span>
		</h1>
		<p class="mt-3 text-lg text-ink-soft italic">Look at the art. Guess the year.</p>
	</div>

	<p class="max-w-md text-ink-soft">
		Five paintings, drawings, and prints pulled from real museum collections. No dates, no artist bios — just
		your eye. Slide to the year you think it was made and see how close you get.
	</p>

	<div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
		<a
			href="/play/daily"
			class="rounded-full bg-terracotta px-8 py-4 font-display text-lg font-semibold text-canvas shadow transition hover:bg-terracotta-dark"
		>
			{puzzleNumber === null ? 'Play today' : alreadyPlayed ? `View #${puzzleNumber} results` : `Play #${puzzleNumber}`}
		</a>
		<a
			href="/play/unlimited"
			class="rounded-full border-2 border-ultramarine px-8 py-4 font-display text-lg font-semibold text-ultramarine transition hover:bg-ultramarine hover:text-canvas"
		>
			Play unlimited
		</a>
	</div>

	{#if streak.current > 0}
		<p class="text-sm text-ink-soft">🔥 {streak.current}-day streak (best: {streak.best})</p>
	{/if}

	<a href="/archive" class="text-sm text-ultramarine underline underline-offset-2">Browse the full archive →</a>
</div>
