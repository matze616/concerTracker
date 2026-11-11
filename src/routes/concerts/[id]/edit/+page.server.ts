import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { formOptions, handleConcertSave, stateFromConcert } from '#lib/server/concert-form.ts';
import { getConcert } from '#lib/server/repo.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const c = getConcert(db(), Number(params.id));
	if (!c) error(404, 'Concert not found');
	return { concert: c, initial: stateFromConcert(c), options: formOptions() };
};

export const actions: Actions = {
	default: ({ request, params }) => handleConcertSave(request, Number(params.id))
};
