import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { listConcerts, renameBand } from '#lib/server/repo.ts';
import { bandStats } from '#lib/server/stats.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const d = db();
	const id = Number(params.id);
	const band = d.$client.prepare(`SELECT id, name FROM bands WHERE id = ?`).get(id) as { id: number; name: string } | undefined;
	if (!band) error(404, 'Band not found');
	return { band, stats: bandStats(d, id), concerts: listConcerts(d, { bandId: id }) };
};

export const actions: Actions = {
	rename: async ({ request, params }) => {
		const name = String((await request.formData()).get('name') ?? '');
		if (!name.trim()) return fail(400, { error: 'Name must not be empty' });
		const id = renameBand(db(), Number(params.id), name);
		redirect(303, `/bands/${id}`);
	}
};
