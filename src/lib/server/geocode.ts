// Geocoding with OpenStreetMap Nominatim (https://operations.osmfoundation.org/policies/nominatim/):
// max. 1 request per second, identifying User-Agent, results are stored so each venue is looked up once.
import { eq } from 'drizzle-orm';
import type { DB } from './db/client';
import { venues } from './db/schema';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'concertracker/0.1 (self-hosted personal concert log)';
let last = 0;
let queue: Promise<unknown> = Promise.resolve();

export const geocodingEnabled = () => (process.env.GEOCODING ?? 'on').toLowerCase() !== 'off';

async function search(q: string): Promise<{ lat: number; lng: number } | null> {
	const wait = Math.max(0, last + 1100 - Date.now());
	if (wait) await new Promise((r) => setTimeout(r, wait));
	last = Date.now();
	const url = `${ENDPOINT}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
	const res = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
		signal: AbortSignal.timeout(8000)
	});
	if (!res.ok) throw new Error(`Nominatim answered ${res.status}`);
	const json = (await res.json()) as { lat: string; lon: string }[];
	return json[0] ? { lat: Number(json[0].lat), lng: Number(json[0].lon) } : null;
}

/** Look up coordinates; tries the full address first, then venue name + city, then city only. */
export function geocode(v: {
	name: string;
	address?: string | null;
	city?: string | null;
	country?: string | null;
}): Promise<{ lat: number; lng: number; precision: 'address' | 'venue' | 'city' } | null> {
	const job = queue.then(async () => {
		const parts = (...p: (string | null | undefined)[]) => p.filter(Boolean).join(', ');
		const attempts: [string, 'address' | 'venue' | 'city'][] = [];
		if (v.address) attempts.push([parts(v.address, v.city, v.country), 'address']);
		attempts.push([parts(v.name, v.city, v.country), 'venue']);
		if (v.city) attempts.push([parts(v.city, v.country), 'city']);
		for (const [q, precision] of attempts) {
			const hit = await search(q);
			if (hit) return { ...hit, precision };
		}
		return null;
	});
	queue = job.catch(() => undefined);
	return job;
}

/** Geocode a stored venue and save the result. Never throws; returns a short status message. */
export async function geocodeVenue(db: DB, id: number): Promise<string> {
	if (!geocodingEnabled()) return 'Geocoding is turned off (GEOCODING=off).';
	const v = db.select().from(venues).where(eq(venues.id, id)).get();
	if (!v) return 'Venue not found.';
	try {
		const hit = await geocode(v);
		if (!hit) return `No location found for “${v.name}”. You can set it on the map.`;
		db.update(venues).set({ lat: hit.lat, lng: hit.lng }).where(eq(venues.id, id)).run();
		return hit.precision === 'city'
			? `Only the city was found for “${v.name}”; drag the marker to fix the exact spot.`
			: `Location found for “${v.name}”.`;
	} catch (e) {
		return `Location lookup failed (${(e as Error).message}). You can retry later on the venue page.`;
	}
}
