import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				// /play/daily and /play/unlimited opt out of prerendering (their
				// content depends on the visitor's real clock / Math.random, see
				// the comments in their +page.ts files) and fall back to this
				// client-rendered shell instead. Supported by Cloudflare Pages,
				// Netlify, and most static hosts as an SPA-style fallback.
				fallback: '200.html',
				precompress: false,
				strict: true
			})
		})
	]
});
