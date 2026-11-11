import { emptyState, formOptions, handleConcertSave, stateForNextDay, stateForSameDay } from '#lib/server/concert-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const from = Number(url.searchParams.get('from'));
	const again = Number(url.searchParams.get('again'));
	const nextDay = from ? stateForNextDay(from) : null;
	const sameDay = !nextDay && again ? stateForSameDay(again) : null;
	return {
		initial: nextDay ?? sameDay ?? emptyState(),
		options: formOptions(),
		prefill: nextDay ? ('nextDay' as const) : sameDay ? ('sameDay' as const) : null
	};
};

export const actions: Actions = {
	default: ({ request }) => handleConcertSave(request)
};
