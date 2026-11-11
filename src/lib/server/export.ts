import type { DB } from './db/client';
import { listConcerts } from './repo';

const csvCell = (v: unknown) => {
	const s = v == null ? '' : String(v);
	return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per concert. Bands in running order separated by " | ", headliners marked with "*". */
export function toCsv(db: DB): string {
	const header = ['date', 'venue', 'address', 'city', 'country', 'latitude', 'longitude', 'event', 'bands', 'headliners', 'people', 'ticket_price', 'currency', 'rating', 'notes'];
	const venues = new Map(
		(db.$client.prepare(`SELECT id, address, lat, lng FROM venues`).all() as { id: number; address: string | null; lat: number | null; lng: number | null }[]).map((v) => [v.id, v])
	);
	const rows = listConcerts(db)
		.reverse()
		.map((c) => {
			const v = venues.get(c.venueId);
			return [
				c.date,
				c.venueName,
				v?.address,
				c.city,
				c.country,
				v?.lat,
				v?.lng,
				c.eventName,
				c.bands.map((b) => b.name).join(' | '),
				c.bands.filter((b) => b.isHeadliner).map((b) => b.name).join(' | '),
				c.people.map((p) => p.name).join(' | '),
				c.ticketPriceCents == null ? '' : (c.ticketPriceCents / 100).toFixed(2),
				c.currency,
				c.rating,
				c.notes
			];
		});
	return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Complete dump of all tables – can be used to rebuild the database. */
export function toJson(db: DB): string {
	const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
	for (const table of ['venues', 'events', 'bands', 'people', 'concerts', 'concert_bands', 'concert_people'])
		dump[table] = db.$client.prepare(`SELECT * FROM ${table}`).all();
	return JSON.stringify(dump, null, 2);
}
