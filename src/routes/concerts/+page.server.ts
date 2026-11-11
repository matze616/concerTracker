import { db } from '#lib/server/db/index.ts';
import { listConcerts, years, type ConcertFilter } from '#lib/server/repo.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const p = url.searchParams;
	const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
	const filter: ConcertFilter = {
		q: p.get('q')?.trim() || undefined,
		year: p.get('year') || undefined,
		bandId: num('band'),
		venueId: num('venue'),
		personId: num('person'),
		eventId: num('event'),
		city: p.get('city') || undefined,
		country: p.get('country') || undefined
	};
	const d = db();
	const name = (table: string, id?: number) =>
		id ? (d.$client.prepare(`SELECT name FROM ${table} WHERE id = ?`).pluck().get(id) as string | undefined) : undefined;
	const active: { key: string; label: string }[] = [];
	if (filter.bandId) active.push({ key: 'band', label: `Band: ${name('bands', filter.bandId)}` });
	if (filter.venueId) active.push({ key: 'venue', label: `Venue: ${name('venues', filter.venueId)}` });
	if (filter.personId) active.push({ key: 'person', label: `With: ${name('people', filter.personId)}` });
	if (filter.eventId) active.push({ key: 'event', label: `Event: ${name('events', filter.eventId)}` });
	if (filter.city) active.push({ key: 'city', label: `City: ${filter.city}` });
	if (filter.country) active.push({ key: 'country', label: `Country: ${filter.country}` });
	return { concerts: listConcerts(d, filter), years: years(d), filter, active };
};
