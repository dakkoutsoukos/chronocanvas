import { error } from '@sveltejs/kit';
import archiveData from '$lib/data/archive.json';
import type { Artwork } from '$lib/game';
import type { EntryGenerator, PageLoad } from './$types';

const artworks = archiveData as Artwork[];

export const prerender = true;

export const entries: EntryGenerator = () => artworks.map((a) => ({ id: a.id }));

export const load: PageLoad = ({ params }) => {
	const artwork = artworks.find((a) => a.id === params.id);
	if (!artwork) error(404, 'Artwork not found');
	return { artwork };
};
