import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { listConcerts, renameEvent, setEventFestival } from '#lib/server/repo.ts';
import { eventStats } from '#lib/server/stats.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const d = db();
	const id = Number(params.id);
	const row = d.$client.prepare(`SELECT id, name, notes, is_festival AS isFestival FROM events WHERE id = ?`).get(id) as
		| { id: number; name: string; notes: string | null; isFestival: number }
		| undefined;
	if (!row) error(404, 'Event not found');
	const event = { ...row, isFestival: !!row.isFestival };
	const concerts = listConcerts(d, { eventId: id }).reverse(); // chronological
	return { event, stats: eventStats(d, id), concerts };
};

export const actions: Actions = {
	rename: async ({ request, params }) => {
		const name = String((await request.formData()).get('name') ?? '');
		if (!name.trim()) return fail(400, { error: 'Name must not be empty' });
		const id = renameEvent(db(), Number(params.id), name);
		redirect(303, `/events/${id}`);
	},
	festival: async ({ request, params }) => {
		const on = (await request.formData()).get('festival') === '1';
		setEventFestival(db(), Number(params.id), on);
		redirect(303, `/events/${params.id}`);
	}
};
