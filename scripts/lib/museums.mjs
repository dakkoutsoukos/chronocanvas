// Fetchers for the three open-access museum APIs this project draws from.
// Each takes a target count and an `addWork` callback (from createCollector)
// so callers control de-duplication, per-artist caps, and "already used"
// exclusion without this module needing to know about any of that.

import { cleanArtistName, sleep } from './collector.mjs';

const MAX_YEAR_SPREAD = 6; // museum's own date range must be this narrow to trust a single "true" year

async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return res.json();
}

export async function fetchAIC({ targetCount, addWork, maxPages = 60 }) {
	console.log('Fetching Art Institute of Chicago...');
	let page = 1;
	let iiifBase = 'https://www.artic.edu/iiif/2';
	let added = 0;
	while (added < targetCount && page <= maxPages) {
		const url =
			`https://api.artic.edu/api/v1/artworks?page=${page}&limit=100` +
			`&fields=id,title,artist_display,date_start,date_end,date_display,image_id,is_public_domain,department_title,medium_display,artwork_type_title`;
		const data = await fetchJson(url);
		if (data.config?.iiif_url) iiifBase = data.config.iiif_url;
		if (!data.data?.length) break;
		for (const a of data.data) {
			if (!a.is_public_domain || !a.image_id) continue;
			const spread = (a.date_end ?? 9999) - (a.date_start ?? -9999);
			if (spread > MAX_YEAR_SPREAD || spread < 0) continue;
			const year = Math.round(((a.date_start ?? 0) + (a.date_end ?? 0)) / 2);
			const artistFull = (a.artist_display || '').split('\n')[0].trim();
			const added_ = addWork({
				id: `aic-${a.id}`,
				title: a.title,
				artist: cleanArtistName(artistFull),
				artistFull: artistFull || 'Unknown artist',
				year,
				yearDisplay: a.date_display || String(year),
				image: `${iiifBase}/${a.image_id}/full/843,/0/default.jpg`,
				medium: a.medium_display || a.artwork_type_title || '',
				source: 'Art Institute of Chicago',
				sourceUrl: `https://www.artic.edu/artworks/${a.id}`,
				license: 'Public Domain'
			});
			if (added_) added++;
		}
		page++;
		await sleep(120);
	}
	console.log(`  AIC: +${added}`);
}

export async function fetchCMA({ targetCount, addWork, maxSkip = 6000 }) {
	console.log('Fetching Cleveland Museum of Art...');
	let skip = 0;
	const limit = 100;
	let added = 0;
	while (added < targetCount && skip < maxSkip) {
		const url = `https://openaccess-api.clevelandart.org/api/artworks/?has_image=1&cc0=1&limit=${limit}&skip=${skip}`;
		const data = await fetchJson(url);
		if (!data.data?.length) break;
		for (const a of data.data) {
			const earliest = a.creation_date_earliest;
			const latest = a.creation_date_latest;
			if (earliest == null || latest == null) continue;
			const spread = latest - earliest;
			if (spread > MAX_YEAR_SPREAD || spread < 0) continue;
			const imageUrl = a.images?.web?.url || a.images?.print?.url;
			if (!imageUrl) continue;
			const year = Math.round((earliest + latest) / 2);
			const artistFull = a.creators?.[0]?.description || 'Unknown artist';
			const added_ = addWork({
				id: `cma-${a.id}`,
				title: a.title,
				artist: cleanArtistName(artistFull),
				artistFull,
				year,
				yearDisplay: a.creation_date || String(year),
				image: imageUrl,
				medium: a.technique || a.type || '',
				source: 'Cleveland Museum of Art',
				sourceUrl: a.url || `https://www.clevelandart.org/art/${a.id}`,
				license: 'CC0'
			});
			if (added_) added++;
		}
		skip += limit;
		await sleep(120);
	}
	console.log(`  CMA: +${added}`);
}

export async function fetchMet({ targetCount, addWork }) {
	console.log('Fetching Metropolitan Museum of Art...');
	// European Paintings, Asian Art, Drawings & Prints, European Sculpture &
	// Decorative Arts, The American Wing, Arms and Armor, Islamic Art, Medieval Art
	const departments = [11, 6, 9, 12, 1, 4, 14, 17];
	let ids = [];
	for (const dep of departments) {
		const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=${dep}&hasImages=true&q=a`;
		try {
			const data = await fetchJson(url);
			if (data.objectIDs) ids.push(...data.objectIDs);
		} catch (e) {
			console.log(`  Met search failed for dept ${dep}: ${e.message}`);
		}
		await sleep(120);
	}
	for (let i = ids.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[ids[i], ids[j]] = [ids[j], ids[i]];
	}
	ids = ids.slice(0, Math.max(targetCount * 12, 200));

	let added = 0;
	const concurrency = 10;
	let idx = 0;
	async function worker() {
		while (idx < ids.length && added < targetCount) {
			const id = ids[idx++];
			try {
				const a = await fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
				const begin = a.objectBeginDate;
				const end = a.objectEndDate;
				if (begin == null || end == null) continue;
				const spread = end - begin;
				if (spread > MAX_YEAR_SPREAD || spread < 0) continue;
				const image = a.primaryImage;
				if (!image) continue;
				if (a.isPublicDomain === false) continue;
				const year = Math.round((begin + end) / 2);
				const artistFull = a.artistDisplayName
					? `${a.artistDisplayName}${a.artistNationality ? ` (${a.artistNationality})` : ''}`
					: 'Unknown artist';
				const added_ = addWork({
					id: `met-${a.objectID}`,
					title: a.title,
					artist: cleanArtistName(a.artistDisplayName),
					artistFull,
					year,
					yearDisplay: a.objectDate || String(year),
					image,
					medium: a.medium || '',
					source: 'Metropolitan Museum of Art',
					sourceUrl: a.objectURL || `https://www.metmuseum.org/art/collection/search/${a.objectID}`,
					license: 'Public Domain'
				});
				if (added_) added++;
			} catch {
				// skip failures silently, there are plenty of candidates
			}
		}
	}
	await Promise.all(Array.from({ length: concurrency }, worker));
	console.log(`  Met: +${added}`);
}
