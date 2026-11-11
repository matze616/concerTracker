import { fail, redirect } from '@sveltejs/kit';
import type { ConcertFormState, FormOptions } from '../types';
import { db } from './db';
import { parseConcertForm } from './forms';
import { geocodeVenue } from './geocode';
import { allBandNames, allEventNames, allPeopleNames, allVenues, getConcert, saveConcert, type ConcertRow } from './repo';
import { todayIso } from '../format';

export function formOptions(): FormOptions {
	const d = db();
	return {
		venues: allVenues(d).map(({ id, name, address, city, country }) => ({ id, name, address, city, country })),
		bands: allBandNames(d),
		people: allPeopleNames(d),
		events: allEventNames(d)
	};
}

export function emptyState(): ConcertFormState {
	return {
		date: todayIso(),
		venueId: null,
		venueName: '',
		venueAddress: '',
		venueCity: '',
		venueCountry: 'Germany', // default for new venues; most concerts are in Germany
		event: '',
		bands: [],
		people: [],
		price: '',
		currency: 'EUR',
		rating: null,
		notes: ''
	};
}

export function stateFromConcert(c: ConcertRow): ConcertFormState {
	return {
		...emptyState(),
		date: c.date,
		venueId: c.venueId,
		venueName: c.venueName,
		venueCity: c.city ?? '',
		venueCountry: c.country ?? '',
		event: c.eventName ?? '',
		bands: c.bands.map((b) => ({ name: b.name, headliner: b.isHeadliner })),
		people: c.people.map((p) => p.name),
		price: c.ticketPriceCents == null ? '' : (c.ticketPriceCents / 100).toFixed(2).replace(/\.00$/, '').replace('.', ','),
		currency: c.currency,
		rating: c.rating,
		notes: c.notes ?? ''
	};
}

/** Prefill for "next festival day": same venue, event, people and currency, the following date. */
export function stateForNextDay(id: number): ConcertFormState | null {
	const c = getConcert(db(), id);
	if (!c) return null;
	const next = new Date(c.date + 'T12:00:00Z');
	next.setUTCDate(next.getUTCDate() + 1);
	return {
		...stateFromConcert(c),
		date: next.toISOString().slice(0, 10),
		bands: [],
		price: '',
		rating: null,
		notes: ''
	};
}

/** Shared form action for create and edit. */
export async function handleConcertSave(request: Request, id?: number) {
	const parsed = parseConcertForm(await request.formData());
	if (!parsed.ok) return fail(400, { errors: parsed.errors, state: parsed.state });
	const d = db();
	const saved = saveConcert(d, parsed.input, id);
	let message = '';
	if (saved.newVenueId) message = await geocodeVenue(d, saved.newVenueId);
	redirect(303, `/concerts/${saved.id}${message ? `?notice=${encodeURIComponent(message)}` : ''}`);
}
