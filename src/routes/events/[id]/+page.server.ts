import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { listConcerts, renameEvent } from '#lib/server/repo.ts';
import { eventStats } from '#lib/server/stats.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const d = db();
	const id = Number(params.id);
	const event = d.$client.prepare(`SELECT id, name, notes FROM events WHERE id = ?`).get(id) as
		| { id: number; name: string; notes: string | null }
		| undefined;
	if (!event) error(404, 'Event not found');
	const concerts = listConcerts(d, { eventId: id }).reverse(); // chronological
	return { event, stats: eventStats(d, id), concerts };
};

export const actions: Actions = {
	rename: async ({ request, params }) => {
		const name = String((await request.formData()).get('name') ?? '');
		if (!name.trim()) return fail(400, { error: 'Name must not be empty' });
		const id = renameEvent(db(), Number(params.id), name);
		redirect(303, `/events/${id}`);
	}
};
