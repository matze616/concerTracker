// Made-up demo data (fictional bands and people). Used by `pnpm db:seed` and the tests.
import type { DB } from './db/client';
import { saveConcert, type ConcertInput } from './repo';

const venues = [
	{ name: 'Rote Halle', address: 'Hafenstraße 12', city: 'Hamburg', country: 'Germany', lat: 53.545, lng: 9.966 },
	{ name: 'Kellerclub', address: 'Lindenweg 3', city: 'Berlin', country: 'Germany', lat: 52.507, lng: 13.425 },
	{ name: 'Stadtpark Bühne', address: 'Parkallee 1', city: 'Munich', country: 'Germany', lat: 48.15, lng: 11.58 },
	{ name: 'The Old Mill', address: '5 River Road', city: 'Manchester', country: 'United Kingdom', lat: 53.48, lng: -2.24 },
	{ name: 'Festivalgelände Nord', address: 'Feldweg', city: 'Wacken-Ost', country: 'Germany', lat: 54.02, lng: 9.37 }
];
const bandPool = [
	'Glass Harbor', 'The Velvet Static', 'Nordlicht', 'Copper Wolves', 'Midnight Ferry', 'Salt & Sundown',
	'Echo Valley', 'Lunar Parade', 'Brass Lanterns', 'Kiesel', 'The Paper Kites Club', 'Iron Meadow',
	'Hollow Pines', 'Neon Orchard', 'Stormfront Choir', 'Paper Planets'
];
const peoplePool = ['Anna', 'Ben', 'Chris', 'Dana', 'Elif', 'Felix'];

/** Small deterministic pseudo random generator so demo data is the same every time. */
function rng(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) % 4294967296;
		return seed / 4294967296;
	};
}

export function demoConcerts(count = 80): ConcertInput[] {
	const r = rng(42);
	const pick = <T>(arr: T[]) => arr[Math.floor(r() * arr.length)];
	const out: ConcertInput[] = [];
	for (let i = 0; i < count; i++) {
		const year = 2010 + Math.floor(r() * 16);
		const month = 1 + Math.floor(r() * 12);
		const day = 1 + Math.floor(r() * 28);
		const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		const venue = pick(venues);
		const isFestival = venue.city === 'Wacken-Ost';
		const n = isFestival ? 4 + Math.floor(r() * 3) : 1 + Math.floor(r() * 3);
		const lineup = new Set<string>();
		while (lineup.size < n) lineup.add(pick(bandPool));
		const people = new Set<string>();
		const nPeople = Math.floor(r() * 3);
		while (people.size < nPeople) people.add(pick(peoplePool));
		out.push({
			date,
			venue,
			event: isFestival ? 'Nordfeld Open Air' : null,
			bands: [...lineup].map((name, idx) => ({ name, headliner: idx === lineup.size - 1 })),
			people: [...people],
			ticketPriceCents: r() < 0.8 ? 1500 + Math.floor(r() * 60) * 100 : null,
			currency: 'EUR',
			rating: r() < 0.7 ? 1 + Math.floor(r() * 5) : null,
			notes: null
		});
	}
	return out;
}

export function seedDemo(db: DB, count = 80) {
	for (const c of demoConcerts(count)) saveConcert(db, c);
	// demo venues already have coordinates
	for (const v of venues)
		db.$client
			.prepare(`UPDATE venues SET lat = ?, lng = ? WHERE name = ? AND lat IS NULL`)
			.run(v.lat, v.lng, v.name);
}
