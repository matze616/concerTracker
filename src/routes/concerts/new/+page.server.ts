import { emptyState, formOptions, handleConcertSave, stateForNextDay } from '#lib/server/concert-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const from = Number(url.searchParams.get('from'));
	const prefill = from ? stateForNextDay(from) : null;
	return { initial: prefill ?? emptyState(), options: formOptions(), nextDay: !!prefill };
};

export const actions: Actions = {
	default: ({ request }) => handleConcertSave(request)
};
