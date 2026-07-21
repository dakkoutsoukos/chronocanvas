<script lang="ts">
	let { data } = $props();
	let a = $derived(data.artwork);
</script>

<svelte:head>
	<title>{a.title} — Chronocanvas Archive</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	<a href="/archive" class="text-sm text-ultramarine underline underline-offset-2">← Back to archive</a>

	<div class="overflow-hidden rounded-lg border border-ink/10 bg-canvas-soft">
		<img src={a.image} alt={a.title} class="max-h-[65vh] w-full object-contain" />
	</div>

	<div class="text-center">
		<h1 class="font-display text-2xl font-semibold italic">{a.title}</h1>
		<p class="mt-1 text-ink-soft">{a.artistFull}</p>
		<p class="mt-3 font-display text-4xl font-semibold text-terracotta-dark">{a.yearDisplay}</p>
		<p class="mt-2 text-sm text-ink-soft">{a.medium}</p>
		<p class="mt-4 text-xs text-ink-soft">
			{a.license} · via
			<a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" class="text-ultramarine underline"
				>{a.source} ↗</a
			>
		</p>
	</div>
</div>
