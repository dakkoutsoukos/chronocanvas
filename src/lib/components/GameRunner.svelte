<script lang="ts">
	import YearSlider from './YearSlider.svelte';
	import YearLine from './YearLine.svelte';
	import {
		ROUNDS_PER_GAME,
		scoreRound,
		judgeRound,
		JUDGEMENT_LABEL,
		scoreTier,
		MAX_GAME_SCORE,
		type Artwork
	} from '$lib/game';
	import type { RoundRecord } from '$lib/storage';

	let {
		artworks,
		mode,
		puzzleNumber,
		onComplete
	}: {
		artworks: Artwork[];
		mode: 'daily' | 'unlimited';
		puzzleNumber?: number;
		onComplete?: (rounds: RoundRecord[], totalScore: number) => void;
	} = $props();

	const YEAR_MIN = 1000;
	const YEAR_MAX = new Date().getFullYear();
	const DEFAULT_GUESS = 1800;

	let roundIndex = $state(0);
	let guessYear = $state(DEFAULT_GUESS);
	let phase = $state<'guessing' | 'reveal' | 'results'>('guessing');
	let rounds = $state<RoundRecord[]>([]);
	let shareCopied = $state(false);

	let current = $derived(artworks[roundIndex]);
	let totalScore = $derived(rounds.reduce((sum, r) => sum + r.score, 0));

	let lastScore = $derived(rounds.length ? rounds[rounds.length - 1].score : 0);
	let lastJudgement = $derived(
		rounds.length ? judgeRound(rounds[rounds.length - 1].guessYear, rounds[rounds.length - 1].actualYear) : 'perfect'
	);

	function submitGuess() {
		const actualYear = current.year;
		const score = scoreRound(guessYear, actualYear);
		rounds = [...rounds, { artworkId: current.id, guessYear, actualYear, score }];
		phase = 'reveal';
	}

	function nextRound() {
		if (roundIndex + 1 >= ROUNDS_PER_GAME) {
			phase = 'results';
			onComplete?.(rounds, totalScore);
			return;
		}
		roundIndex += 1;
		guessYear = DEFAULT_GUESS;
		phase = 'guessing';
	}

	function shareText(): string {
		const tier = scoreTier(totalScore);
		const squares = rounds
			.map((r) => {
				const j = judgeRound(r.guessYear, r.actualYear);
				return { perfect: '🟩', close: '🟨', decent: '🟧', off: '🟥', 'way-off': '⬛' }[j];
			})
			.join('');
		const label = mode === 'daily' ? `Chronocanvas #${puzzleNumber}` : 'Chronocanvas (unlimited)';
		return `${label} — ${totalScore.toLocaleString()}/${MAX_GAME_SCORE.toLocaleString()} · ${tier.label}\n${squares}`;
	}

	async function copyShare() {
		try {
			await navigator.clipboard.writeText(shareText());
			shareCopied = true;
			setTimeout(() => (shareCopied = false), 2000);
		} catch {
			// clipboard API unavailable, silently ignore
		}
	}
</script>

{#if phase === 'guessing' && current}
	<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
		<div class="flex items-baseline justify-between text-sm text-ink-soft">
			<span>Round {roundIndex + 1} of {ROUNDS_PER_GAME}</span>
			<span>Score so far: {totalScore.toLocaleString()}</span>
		</div>

		<div class="overflow-hidden rounded-lg border border-ink/10 bg-canvas-soft shadow-sm">
			<img src={current.image} alt="" class="max-h-[60vh] w-full object-contain bg-canvas-soft" />
		</div>

		<div class="text-center">
			<p class="font-display text-xl italic">{current.title}</p>
			<p class="text-sm text-ink-soft">{current.artist}</p>
		</div>

		<YearSlider bind:value={guessYear} min={YEAR_MIN} max={YEAR_MAX} />

		<button
			onclick={submitGuess}
			class="mx-auto rounded-full bg-terracotta px-8 py-3 font-display text-lg font-semibold text-canvas shadow transition hover:bg-terracotta-dark"
		>
			Lock in {guessYear}
		</button>
	</div>
{:else if phase === 'reveal' && rounds.length}
	{@const record = rounds[rounds.length - 1]}
	{@const artwork = artworks[roundIndex]}
	<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
		<div class="overflow-hidden rounded-lg border border-ink/10 bg-canvas-soft shadow-sm">
			<img src={artwork.image} alt={artwork.title} class="max-h-[50vh] w-full object-contain bg-canvas-soft" />
		</div>

		<div class="text-center">
			<p class="font-display text-xl italic">{artwork.title}</p>
			<p class="text-sm text-ink-soft">{artwork.artistFull}</p>
			<p class="text-sm text-ink-soft">{artwork.medium}</p>
			<a
				href={artwork.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-ultramarine underline underline-offset-2">via {artwork.source} ↗</a
			>
		</div>

		<div class="rounded-lg bg-canvas-soft p-6 text-center">
			<p class="font-display text-2xl font-semibold text-ink">{JUDGEMENT_LABEL[lastJudgement]}</p>
			<p class="mt-1 text-ink-soft">
				Painted in <strong class="text-ink">{artwork.yearDisplay}</strong> — you guessed
				<strong class="text-ink">{record.guessYear}</strong>
			</p>
			<p class="mt-2 font-display text-3xl font-semibold text-terracotta-dark">
				+{lastScore.toLocaleString()} pts
			</p>
		</div>

		<YearLine min={YEAR_MIN} max={YEAR_MAX} guess={record.guessYear} actual={record.actualYear} />

		<button
			onclick={nextRound}
			class="mx-auto rounded-full bg-ultramarine px-8 py-3 font-display text-lg font-semibold text-canvas shadow transition hover:bg-ultramarine-dark"
		>
			{roundIndex + 1 >= ROUNDS_PER_GAME ? 'See final score' : 'Next round'}
		</button>
	</div>
{:else if phase === 'results'}
	{@const tier = scoreTier(totalScore)}
	<div class="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
		<p class="text-sm tracking-wide text-ink-soft uppercase">
			{mode === 'daily' ? `Chronocanvas #${puzzleNumber}` : 'Unlimited round complete'}
		</p>
		<p class="font-display text-6xl font-semibold text-terracotta-dark">
			{totalScore.toLocaleString()}<span class="text-2xl text-ink-soft">/{MAX_GAME_SCORE.toLocaleString()}</span>
		</p>
		<p class="font-display text-2xl">{tier.label}</p>
		<p class="text-ink-soft">{tier.blurb}</p>

		<div class="flex w-full flex-col gap-2">
			{#each rounds as r, i (r.artworkId)}
				<div class="flex items-center justify-between rounded-md bg-canvas-soft px-4 py-2 text-sm text-ink">
					<span>Round {i + 1}</span>
					<span class="text-ink-soft">guessed {r.guessYear} · actual {r.actualYear}</span>
					<span class="font-semibold text-terracotta-dark">{r.score.toLocaleString()}</span>
				</div>
			{/each}
		</div>

		<button
			onclick={copyShare}
			class="rounded-full border-2 border-ultramarine px-6 py-2 font-display font-semibold text-ultramarine transition hover:bg-ultramarine hover:text-canvas"
		>
			{shareCopied ? 'Copied!' : 'Copy results'}
		</button>
	</div>
{/if}
