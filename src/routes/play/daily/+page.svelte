<script lang="ts">
	import { browser } from '$app/environment';
	import archiveData from '$lib/data/archive.json';
	import currentMonthData from '$lib/data/current-month.json';
	import GameRunner from '$lib/components/GameRunner.svelte';
	import {
		getDailyArtworks,
		dailyPuzzleNumber,
		todayKey,
		scoreTier,
		MAX_GAME_SCORE,
		type Artwork,
		type CurrentMonth
	} from '$lib/game';
	import { getDailyResult, saveDailyResult, type RoundRecord } from '$lib/storage';

	const archive = archiveData as Artwork[];
	const currentMonth = currentMonthData as CurrentMonth;
	const dateKey = todayKey();
	const puzzleNumber = dailyPuzzleNumber(dateKey);
	const dailyArtworks = getDailyArtworks(archive, currentMonth, dateKey);

	let existing = $state<ReturnType<typeof getDailyResult>>(null);
	let hydrated = $state(false);

	if (browser) {
		existing = getDailyResult(dateKey);
		hydrated = true;
	}

	function handleComplete(rounds: RoundRecord[], totalScore: number) {
		saveDailyResult({
			puzzleNumber,
			dateKey,
			rounds,
			totalScore,
			completedAt: new Date().toISOString()
		});
	}
</script>

<svelte:head>
	<title>Chronocanvas — Daily #{puzzleNumber}</title>
</svelte:head>

{#if !hydrated}
	<p class="text-center text-ink-soft">Loading today's puzzle…</p>
{:else if existing}
	{@const tier = scoreTier(existing.totalScore)}
	<div class="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
		<p class="text-sm tracking-wide text-ink-soft uppercase">Chronocanvas #{puzzleNumber} — already played</p>
		<p class="font-display text-6xl font-semibold text-terracotta-dark">
			{existing.totalScore.toLocaleString()}<span class="text-2xl text-ink-soft"
				>/{MAX_GAME_SCORE.toLocaleString()}</span
			>
		</p>
		<p class="font-display text-2xl">{tier.label}</p>
		<p class="text-ink-soft">Come back tomorrow for a new puzzle, or keep going in unlimited mode.</p>
		<a
			href="/play/unlimited"
			class="mt-2 rounded-full bg-ultramarine px-6 py-3 font-display font-semibold text-canvas hover:bg-ultramarine-dark"
		>
			Play unlimited
		</a>
	</div>
{:else}
	<GameRunner artworks={dailyArtworks} mode="daily" {puzzleNumber} onComplete={handleComplete} />
{/if}
