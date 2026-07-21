<script lang="ts">
	import archiveData from '$lib/data/archive.json';
	import type { Artwork } from '$lib/game';

	const artworks = archiveData as Artwork[];

	let query = $state('');

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return artworks;
		return artworks.filter(
			(a) =>
				a.title.toLowerCase().includes(q) ||
				a.artist.toLowerCase().includes(q) ||
				String(a.year).includes(q) ||
				a.source.toLowerCase().includes(q)
		);
	});
</script>

<svelte:head>
	<title>Chronocanvas — Archive</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-8 text-center">
		<h1 class="font-display text-3xl font-semibold">The Archive</h1>
		<p class="mt-2 text-ink-soft">Every piece in the current pool, with the year revealed. {artworks.length} works.</p>
	</div>

	<div class="mx-auto mb-8 max-w-md">
		<input
			type="search"
			bind:value={query}
			placeholder="Search by title, artist, or year…"
			class="w-full rounded-full border border-ink/15 bg-canvas-soft px-5 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-terracotta"
		/>
	</div>

	<p class="mb-4 text-sm text-ink-soft">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
		{#each filtered as a (a.id)}
			<a
				href={`/archive/${a.id}`}
				class="group overflow-hidden rounded-lg border border-ink/10 bg-canvas-soft transition hover:border-terracotta"
			>
				<div class="aspect-square overflow-hidden bg-canvas">
					<img
						src={a.image}
						alt={a.title}
						loading="lazy"
						class="h-full w-full object-cover transition group-hover:scale-105"
					/>
				</div>
				<div class="p-3">
					<p class="truncate font-display text-sm font-semibold text-ink">{a.title}</p>
					<p class="flex justify-between gap-2 text-xs text-ink-soft">
						<span class="truncate">{a.artist}</span>
						<span class="shrink-0">{a.year}</span>
					</p>
				</div>
			</a>
		{/each}
	</div>
</div>
