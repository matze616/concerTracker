import type { ConcertInput } from './repo';

import type { ConcertFormState, FormErrors } from '../types';
export type { ConcertFormState, FormErrors };

/** Accepts "30", "30.5", "30,50", "€ 30" → cents. Empty → null. */
export function parsePrice(s: string): number | null | 'invalid' {
	const v = s.replace(/[€$£\s]/g, '').replace(',', '.');
	if (v === '') return null;
	if (!/^\d+(\.\d{1,2})?$/.test(v)) return 'invalid';
	return Math.round(Number(v) * 100);
}

export function parseConcertForm(
	data: FormData
): { ok: true; input: ConcertInput; state: ConcertFormState } | { ok: false; errors: FormErrors; state: ConcertFormState | null } {
	let state: ConcertFormState;
	try {
		state = JSON.parse(String(data.get('payload') ?? ''));
	} catch {
		return { ok: false, errors: { form: 'Could not read the form. Please try again.' }, state: null };
	}
	const errors: FormErrors = {};

	if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date ?? '') || isNaN(Date.parse(state.date)))
		errors.date = 'Please enter a valid date.';
	if (!state.venueId && !state.venueName?.trim()) errors.venue = 'Please choose or enter a venue.';

	const bands = (state.bands ?? [])
		.map((b) => ({ name: String(b.name ?? '').trim(), headliner: !!b.headliner }))
		.filter((b) => b.name)
		.reverse(); // form order is top of the bill first; storage is running order (first on stage first)
	if (bands.length === 0) errors.bands = 'Add at least one band.';

	const price = parsePrice(state.price ?? '');
	if (price === 'invalid') errors.price = 'Use a number like 35 or 35,50.';

	const rating = state.rating == null ? null : Number(state.rating);
	if (rating != null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5))
		errors.rating = 'Rating must be 1–5.';

	if (Object.keys(errors).length) return { ok: false, errors, state };

	return {
		ok: true,
		state,
		input: {
			date: state.date,
			venue: {
				id: state.venueId,
				name: state.venueName,
				address: state.venueAddress,
				city: state.venueCity,
				country: state.venueCountry,
				updateAddress: !!state.venueEdit
			},
			event: state.event,
			bands,
			people: (state.people ?? []).map((p) => String(p).trim()).filter(Boolean),
			ticketPriceCents: price as number | null,
			currency: (state.currency || 'EUR').toUpperCase().slice(0, 3),
			rating,
			notes: state.notes
		}
	};
}
