<script lang="ts">
	import archiveData from '$lib/data/archive.json';
	import GameRunner from '$lib/components/GameRunner.svelte';
	import { getRandomArtworks, type Artwork } from '$lib/game';

	const artworks = archiveData as Artwork[];

	let gameId = $state(0);
	let currentSet = $state(getRandomArtworks(artworks));

	function playAgain() {
		gameId += 1;
		currentSet = getRandomArtworks(artworks);
	}
</script>

<svelte:head>
	<title>Chronocanvas — Unlimited</title>
</svelte:head>

<div class="mx-auto mb-6 max-w-3xl text-center">
	<p class="text-sm tracking-wide text-ink-soft uppercase">Unlimited mode</p>
</div>

{#key gameId}
	<GameRunner artworks={currentSet} mode="unlimited" />
{/key}

<div class="mx-auto mt-8 max-w-xl text-center">
	<button onclick={playAgain} class="text-sm text-ultramarine underline underline-offset-2">
		Start a fresh round →
	</button>
</div>
