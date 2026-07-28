import archiveData from '$lib/data/archive.json';
import type { Artwork } from '$lib/game';
import type { RequestHandler } from './$types';

export const prerender = true;

const SITE_URL = 'https://chronocanvas-141.netlify.app';

const artworks = archiveData as Artwork[];

export const GET: RequestHandler = () => {
	const staticPaths = ['/', '/play/daily', '/play/unlimited', '/archive'];
	const archivePaths = artworks.map((a) => `/archive/${a.id}`);

	const urls = [...staticPaths, ...archivePaths]
		.map((path) => `\t<url>\n\t\t<loc>${SITE_URL}${path}</loc>\n\t</url>`)
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
