import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { geocodeVenue } from '#lib/server/geocode.ts';
import { allVenues, deleteVenueIfUnused, listConcerts, mergeVenue, updateVenue } from '#lib/server/repo.ts';
import { venueStats } from '#lib/server/stats.ts';
import type { Venue } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const d = db();
	const id = Number(params.id);
	const venue = d.$client.prepare(`SELECT * FROM venues WHERE id = ?`).get(id) as Venue | undefined;
	if (!venue) error(404, 'Venue not found');
	return {
		venue,
		stats: venueStats(d, id),
		concerts: listConcerts(d, { venueId: id }),
		others: allVenues(d)
			.filter((v) => v.id !== id)
			.map((v) => ({ id: v.id, name: v.name, city: v.city })),
		notice: url.searchParams.get('notice')
	};
};

const num = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').trim().replace(',', '.');
	return s === '' || isNaN(Number(s)) ? null : Number(s);
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Name must not be empty' });
		const lat = num(f.get('lat'));
		const lng = num(f.get('lng'));
		if ((lat != null && Math.abs(lat) > 90) || (lng != null && Math.abs(lng) > 180))
			return fail(400, { error: 'Coordinates are out of range' });
		try {
			updateVenue(db(), Number(params.id), {
				name,
				address: String(f.get('address') ?? ''),
				city: String(f.get('city') ?? ''),
				country: String(f.get('country') ?? ''),
				notes: String(f.get('notes') ?? ''),
				lat,
				lng
			});
		} catch (e) {
			if (String(e).includes('UNIQUE')) return fail(400, { error: 'A venue with this name already exists in this city. Use “Merge” instead.' });
			throw e;
		}
		redirect(303, `/venues/${params.id}?notice=${encodeURIComponent('Saved.')}`);
	},
	geocode: async ({ params }) => {
		const msg = await geocodeVenue(db(), Number(params.id));
		redirect(303, `/venues/${params.id}?notice=${encodeURIComponent(msg)}`);
	},
	merge: async ({ request, params }) => {
		const into = Number((await request.formData()).get('into'));
		if (!into) return fail(400, { error: 'Choose a venue to merge into' });
		mergeVenue(db(), Number(params.id), into);
		redirect(303, `/venues/${into}?notice=${encodeURIComponent('Venues merged.')}`);
	},
	delete: ({ params }) => {
		if (!deleteVenueIfUnused(db(), Number(params.id))) return fail(400, { error: 'This venue still has concerts.' });
		redirect(303, '/venues');
	}
};
