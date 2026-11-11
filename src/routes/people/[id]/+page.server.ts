import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { listConcerts, renamePerson } from '#lib/server/repo.ts';
import { personStats } from '#lib/server/stats.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const d = db();
	const id = Number(params.id);
	const person = d.$client.prepare(`SELECT id, name FROM people WHERE id = ?`).get(id) as { id: number; name: string } | undefined;
	if (!person) error(404, 'Person not found');
	return { person, stats: personStats(d, id), concerts: listConcerts(d, { personId: id }) };
};

export const actions: Actions = {
	rename: async ({ request, params }) => {
		const name = String((await request.formData()).get('name') ?? '');
		if (!name.trim()) return fail(400, { error: 'Name must not be empty' });
		const id = renamePerson(db(), Number(params.id), name);
		redirect(303, `/people/${id}`);
	}
};
