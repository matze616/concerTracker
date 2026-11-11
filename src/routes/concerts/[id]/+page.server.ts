import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { deleteConcert, getConcert } from '#lib/server/repo.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const d = db();
	const concert = getConcert(d, Number(params.id));
	if (!concert) error(404, 'Concert not found');
	const venue = d.$client.prepare(`SELECT * FROM venues WHERE id = ?`).get(concert.venueId) as {
		address: string | null;
		lat: number | null;
		lng: number | null;
	};
	// times seen each band up to and including this concert
	const counts = d.$client
		.prepare(
			`SELECT cb.band_id AS id, count(*) AS n FROM concert_bands cb JOIN concerts c ON c.id = cb.concert_id
			 WHERE cb.band_id IN (SELECT band_id FROM concert_bands WHERE concert_id = ?)
			   AND (c.date < ? OR (c.date = ? AND c.id <= ?))
			 GROUP BY cb.band_id`
		)
		.all(concert.id, concert.date, concert.date, concert.id) as { id: number; n: number }[];
	return {
		concert,
		venue,
		timesSeen: Object.fromEntries(counts.map((r) => [r.id, r.n])),
		notice: url.searchParams.get('notice')
	};
};

export const actions: Actions = {
	delete: ({ params }) => {
		deleteConcert(db(), Number(params.id));
		redirect(303, '/concerts');
	}
};
