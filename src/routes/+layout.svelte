<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';

	let { children } = $props();

	type Theme = 'light' | 'dark' | null;
	let theme = $state<Theme>(null);

	if (browser) {
		const stored = localStorage.getItem('chronocanvas:theme') as Theme;
		if (stored === 'light' || stored === 'dark') {
			theme = stored;
			document.documentElement.setAttribute('data-theme', stored);
		}
	}

	function toggleTheme() {
		const prefersDark = browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
		const currentEffective = theme ?? (prefersDark ? 'dark' : 'light');
		const next: Theme = currentEffective === 'dark' ? 'light' : 'dark';
		theme = next;
		document.documentElement.setAttribute('data-theme', next);
		localStorage.setItem('chronocanvas:theme', next);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-ink/10">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
			<a href="/" class="font-display text-xl font-semibold">
				Chrono<span class="text-terracotta-dark">canvas</span>
			</a>
			<nav class="flex items-center gap-5 text-sm">
				<a href="/play/daily" class="hover:text-terracotta-dark">Daily</a>
				<a href="/play/unlimited" class="hover:text-terracotta-dark">Unlimited</a>
				<a href="/archive" class="hover:text-terracotta-dark">Archive</a>
				<button
					onclick={toggleTheme}
					aria-label="Toggle color theme"
					class="rounded-full border border-ink/15 px-3 py-1 text-xs hover:border-ink/40"
				>
					{(theme ?? 'auto') === 'dark' ? '☀︎' : '☾'}
				</button>
			</nav>
		</div>
	</header>

	<main class="flex-1 px-4 py-10">
		{@render children()}
	</main>

	<footer class="border-t border-ink/10 px-4 py-6 text-center text-xs text-ink-soft">
		<p>
			Artwork sourced from the open-access collections of the Metropolitan Museum of Art, the Cleveland Museum of
			Art, and the Art Institute of Chicago. Full credit and links on every piece.
		</p>
	</footer>
</div>
