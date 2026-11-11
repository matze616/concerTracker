import { and, eq, sql } from 'drizzle-orm';
import type { DB } from './db/client';
import * as t from './db/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VenueInput {
	id?: number | null;
	name: string;
	address?: string | null;
	city?: string | null;
	country?: string | null;
	/** With an existing `id`: overwrite that venue's address, city and country with the values above. */
	updateAddress?: boolean;
}

export interface ConcertInput {
	date: string;
	venue: VenueInput;
	event?: string | null;
	/** Marks the event as festival (true) or tour/other (false); undefined leaves it unchanged. */
	eventIsFestival?: boolean;
	/** In running order; first = opener */
	bands: { name: string; headliner: boolean }[];
	people: string[];
	ticketPriceCents?: number | null;
	currency?: string;
	rating?: number | null;
	notes?: string | null;
}

export interface ConcertBand {
	id: number;
	name: string;
	position: number;
	isHeadliner: boolean;
}

export interface ConcertRow {
	id: number;
	date: string;
	venueId: number;
	venueName: string;
	city: string | null;
	country: string | null;
	eventId: number | null;
	eventName: string | null;
	eventIsFestival: boolean;
	ticketPriceCents: number | null;
	currency: string;
	rating: number | null;
	notes: string | null;
	bands: ConcertBand[];
	people: { id: number; name: string }[];
}

export interface ConcertFilter {
	q?: string;
	year?: string;
	bandId?: number;
	venueId?: number;
	personId?: number;
	eventId?: number;
	city?: string;
	country?: string;
	limit?: number;
}

const clean = (s: string | null | undefined) => {
	const v = (s ?? '').replace(/\s+/g, ' ').trim();
	return v === '' ? null : v;
};

// ---------------------------------------------------------------------------
// Find-or-create helpers (case-insensitive)
// ---------------------------------------------------------------------------

export function findOrCreateBand(db: DB, name: string): number {
	const n = clean(name)!;
	const found = db
		.select({ id: t.bands.id })
		.from(t.bands)
		.where(sql`lower(${t.bands.name}) = lower(${n})`)
		.get();
	if (found) return found.id;
	return db.insert(t.bands).values({ name: n }).returning({ id: t.bands.id }).get().id;
}

export function findOrCreatePerson(db: DB, name: string): number {
	const n = clean(name)!;
	const found = db
		.select({ id: t.people.id })
		.from(t.people)
		.where(sql`lower(${t.people.name}) = lower(${n})`)
		.get();
	if (found) return found.id;
	return db.insert(t.people).values({ name: n }).returning({ id: t.people.id }).get().id;
}

/** `isFestival` given → also stored on an existing event (the flag belongs to the event, not the concert). */
export function findOrCreateEvent(db: DB, name: string, isFestival?: boolean): number {
	const n = clean(name)!;
	const found = db
		.select({ id: t.events.id, isFestival: t.events.isFestival })
		.from(t.events)
		.where(sql`lower(${t.events.name}) = lower(${n})`)
		.get();
	if (found) {
		if (isFestival != null && isFestival !== found.isFestival)
			db.update(t.events).set({ isFestival }).where(eq(t.events.id, found.id)).run();
		return found.id;
	}
	return db
		.insert(t.events)
		.values({ name: n, isFestival: !!isFestival })
		.returning({ id: t.events.id })
		.get().id;
}

export function setEventFestival(db: DB, id: number, isFestival: boolean) {
	db.update(t.events).set({ isFestival }).where(eq(t.events.id, id)).run();
}

/** Returns the venue id and whether it was created or its address changed (so it should be geocoded). */
export function findOrCreateVenue(db: DB, v: VenueInput): { id: number; created: boolean } {
	if (v.id) {
		const exists = db.select().from(t.venues).where(eq(t.venues.id, v.id)).get();
		if (exists) {
			if (!v.updateAddress) return { id: exists.id, created: false };
			const next = { address: clean(v.address), city: clean(v.city), country: clean(v.country) };
			const changed = next.address !== exists.address || next.city !== exists.city || next.country !== exists.country;
			if (changed) db.update(t.venues).set(next).where(eq(t.venues.id, exists.id)).run();
			return { id: exists.id, created: changed };
		}
	}
	const name = clean(v.name)!;
	const city = clean(v.city);
	const found = db
		.select({ id: t.venues.id })
		.from(t.venues)
		.where(
			and(
				sql`lower(${t.venues.name}) = lower(${name})`,
				sql`lower(coalesce(${t.venues.city}, '')) = lower(${city ?? ''})`
			)
		)
		.get();
	if (found) return { id: found.id, created: false };
	const id = db
		.insert(t.venues)
		.values({ name, city, address: clean(v.address), country: clean(v.country) })
		.returning({ id: t.venues.id })
		.get().id;
	return { id, created: true };
}

// ---------------------------------------------------------------------------
// Concerts
// ---------------------------------------------------------------------------

/** Creates (id undefined) or updates a concert. Returns id and the id of a new or re-addressed venue to geocode, if any. */
export function saveConcert(
	db: DB,
	input: ConcertInput,
	id?: number
): { id: number; newVenueId: number | null } {
	return db.transaction((tx) => {
		const txdb = tx as unknown as DB;
		const venue = findOrCreateVenue(txdb, input.venue);
		const eventName = clean(input.event);
		const eventId = eventName ? findOrCreateEvent(txdb, eventName, input.eventIsFestival) : null;
		const values = {
			date: input.date,
			venueId: venue.id,
			eventId,
			ticketPriceCents: input.ticketPriceCents ?? null,
			currency: input.currency || 'EUR',
			rating: input.rating ?? null,
			notes: clean(input.notes)
		};

		let concertId: number;
		if (id) {
			tx.update(t.concerts).set(values).where(eq(t.concerts.id, id)).run();
			tx.delete(t.concertBands).where(eq(t.concertBands.concertId, id)).run();
			tx.delete(t.concertPeople).where(eq(t.concertPeople.concertId, id)).run();
			concertId = id;
		} else {
			concertId = tx.insert(t.concerts).values(values).returning({ id: t.concerts.id }).get().id;
		}

		const seenBands = new Set<number>();
		let position = 0;
		for (const b of input.bands) {
			if (!clean(b.name)) continue;
			const bandId = findOrCreateBand(txdb, b.name);
			if (seenBands.has(bandId)) continue;
			seenBands.add(bandId);
			tx.insert(t.concertBands)
				.values({ concertId, bandId, position: position++, isHeadliner: !!b.headliner })
				.run();
		}

		const seenPeople = new Set<number>();
		for (const p of input.people) {
			if (!clean(p)) continue;
			const personId = findOrCreatePerson(txdb, p);
			if (seenPeople.has(personId)) continue;
			seenPeople.add(personId);
			tx.insert(t.concertPeople).values({ concertId, personId }).run();
		}

		removeOrphans(txdb);
		return { id: concertId, newVenueId: venue.created ? venue.id : null };
	});
}

export function deleteConcert(db: DB, id: number) {
	db.transaction((tx) => {
		tx.delete(t.concerts).where(eq(t.concerts.id, id)).run();
		removeOrphans(tx as unknown as DB);
	});
}

/** Deletes bands/people/events no longer used by any concert (keeps venues: they hold address data). */
export function removeOrphans(db: DB) {
	db.run(sql`DELETE FROM bands WHERE id NOT IN (SELECT band_id FROM concert_bands)`);
	db.run(sql`DELETE FROM people WHERE id NOT IN (SELECT person_id FROM concert_people)`);
	db.run(
		sql`DELETE FROM events WHERE id NOT IN (SELECT event_id FROM concerts WHERE event_id IS NOT NULL)`
	);
}

export function listConcerts(db: DB, f: ConcertFilter = {}): ConcertRow[] {
	const where: string[] = [];
	const params: Record<string, unknown> = {};
	if (f.year) {
		where.push(`substr(c.date, 1, 4) = @year`);
		params.year = f.year;
	}
	if (f.venueId) {
		where.push(`c.venue_id = @venueId`);
		params.venueId = f.venueId;
	}
	if (f.eventId) {
		where.push(`c.event_id = @eventId`);
		params.eventId = f.eventId;
	}
	if (f.city) {
		where.push(`lower(v.city) = lower(@city)`);
		params.city = f.city;
	}
	if (f.country) {
		where.push(`lower(v.country) = lower(@country)`);
		params.country = f.country;
	}
	if (f.bandId) {
		where.push(`c.id IN (SELECT concert_id FROM concert_bands WHERE band_id = @bandId)`);
		params.bandId = f.bandId;
	}
	if (f.personId) {
		where.push(`c.id IN (SELECT concert_id FROM concert_people WHERE person_id = @personId)`);
		params.personId = f.personId;
	}
	if (f.q) {
		where.push(`(
			v.name LIKE @q OR v.city LIKE @q OR e.name LIKE @q OR c.notes LIKE @q
			OR c.id IN (SELECT cb.concert_id FROM concert_bands cb JOIN bands b ON b.id = cb.band_id WHERE b.name LIKE @q)
			OR c.id IN (SELECT cp.concert_id FROM concert_people cp JOIN people p ON p.id = cp.person_id WHERE p.name LIKE @q)
		)`);
		params.q = `%${f.q}%`;
	}
	const sqlText = `
		SELECT c.id, c.date, c.venue_id AS venueId, v.name AS venueName, v.city, v.country,
		       c.event_id AS eventId, e.name AS eventName, coalesce(e.is_festival, 0) AS eventIsFestival, c.ticket_price_cents AS ticketPriceCents,
		       c.currency, c.rating, c.notes
		FROM concerts c
		JOIN venues v ON v.id = c.venue_id
		LEFT JOIN events e ON e.id = c.event_id
		${where.length ? 'WHERE ' + where.join(' AND ') : ''}
		ORDER BY c.date DESC, c.id DESC
		${f.limit ? 'LIMIT ' + Math.floor(f.limit) : ''}`;
	const rows = db.$client.prepare(sqlText).all(params) as Omit<ConcertRow, 'bands' | 'people'>[];
	return attachLineups(db, rows);
}

export function getConcert(db: DB, id: number): ConcertRow | undefined {
	const row = db.$client
		.prepare(
			`SELECT c.id, c.date, c.venue_id AS venueId, v.name AS venueName, v.city, v.country,
			        c.event_id AS eventId, e.name AS eventName, coalesce(e.is_festival, 0) AS eventIsFestival, c.ticket_price_cents AS ticketPriceCents,
			        c.currency, c.rating, c.notes
			 FROM concerts c JOIN venues v ON v.id = c.venue_id LEFT JOIN events e ON e.id = c.event_id
			 WHERE c.id = ?`
		)
		.get(id) as Omit<ConcertRow, 'bands' | 'people'> | undefined;
	return row ? attachLineups(db, [row])[0] : undefined;
}

function attachLineups(db: DB, rows: Omit<ConcertRow, 'bands' | 'people'>[]): ConcertRow[] {
	if (rows.length === 0) return [];
	const ids = rows.map((r) => r.id);
	const placeholders = ids.map(() => '?').join(',');
	const bandRows = db.$client
		.prepare(
			`SELECT cb.concert_id AS concertId, b.id, b.name, cb.position, cb.is_headliner AS isHeadliner
			 FROM concert_bands cb JOIN bands b ON b.id = cb.band_id
			 WHERE cb.concert_id IN (${placeholders}) ORDER BY cb.position`
		)
		.all(...ids) as (ConcertBand & { concertId: number })[];
	const peopleRows = db.$client
		.prepare(
			`SELECT cp.concert_id AS concertId, p.id, p.name
			 FROM concert_people cp JOIN people p ON p.id = cp.person_id
			 WHERE cp.concert_id IN (${placeholders}) ORDER BY p.name COLLATE NOCASE`
		)
		.all(...ids) as { concertId: number; id: number; name: string }[];

	const byId = new Map<number, ConcertRow>();
	const result = rows.map((r) => {
		const full: ConcertRow = { ...r, eventIsFestival: !!r.eventIsFestival, bands: [], people: [] };
		byId.set(r.id, full);
		return full;
	});
	for (const b of bandRows)
		byId.get(b.concertId)!.bands.push({
			id: b.id,
			name: b.name,
			position: b.position,
			isHeadliner: !!b.isHeadliner
		});
	for (const p of peopleRows) byId.get(p.concertId)!.people.push({ id: p.id, name: p.name });
	return result;
}

/** The headliner(s) of a concert, falling back to the last band on stage. */
export function headliners(c: Pick<ConcertRow, 'bands'>): ConcertBand[] {
	const h = c.bands.filter((b) => b.isHeadliner);
	if (h.length) return h;
	return c.bands.length ? [c.bands[c.bands.length - 1]] : [];
}

// ---------------------------------------------------------------------------
// Lookups for autocompletion and filters
// ---------------------------------------------------------------------------

export function allBandNames(db: DB): string[] {
	return db.$client
		.prepare(`SELECT name FROM bands ORDER BY name COLLATE NOCASE`)
		.pluck()
		.all() as string[];
}

export function allPeopleNames(db: DB): string[] {
	return db.$client
		.prepare(`SELECT name FROM people ORDER BY name COLLATE NOCASE`)
		.pluck()
		.all() as string[];
}

export function allEventOptions(db: DB): { name: string; isFestival: boolean }[] {
	return (
		db.$client.prepare(`SELECT name, is_festival AS isFestival FROM events ORDER BY name COLLATE NOCASE`).all() as {
			name: string;
			isFestival: number;
		}[]
	).map((e) => ({ name: e.name, isFestival: !!e.isFestival }));
}

export function allVenues(db: DB) {
	return db.select().from(t.venues).orderBy(sql`${t.venues.name} COLLATE NOCASE`).all();
}

export function years(db: DB): string[] {
	return db.$client
		.prepare(`SELECT DISTINCT substr(date, 1, 4) FROM concerts ORDER BY 1 DESC`)
		.pluck()
		.all() as string[];
}

// ---------------------------------------------------------------------------
// Rename / merge (fix typos without losing history)
// ---------------------------------------------------------------------------

/** Rename a band. If another band already has that name, the two are merged. Returns the surviving id. */
export function renameBand(db: DB, id: number, newName: string): number {
	const name = clean(newName);
	if (!name) throw new Error('Name must not be empty');
	return db.transaction((tx) => {
		const other = tx
			.select({ id: t.bands.id })
			.from(t.bands)
			.where(and(sql`lower(${t.bands.name}) = lower(${name})`, sql`${t.bands.id} <> ${id}`))
			.get();
		if (!other) {
			tx.update(t.bands).set({ name }).where(eq(t.bands.id, id)).run();
			return id;
		}
		// Move appearances to the existing band, skipping concerts where both appear
		tx.run(sql`UPDATE OR IGNORE concert_bands SET band_id = ${other.id} WHERE band_id = ${id}`);
		tx.delete(t.bands).where(eq(t.bands.id, id)).run();
		tx.update(t.bands).set({ name }).where(eq(t.bands.id, other.id)).run();
		return other.id;
	});
}

/** Rename a person, merging with an existing person of the same name. Returns the surviving id. */
export function renamePerson(db: DB, id: number, newName: string): number {
	const name = clean(newName);
	if (!name) throw new Error('Name must not be empty');
	return db.transaction((tx) => {
		const other = tx
			.select({ id: t.people.id })
			.from(t.people)
			.where(and(sql`lower(${t.people.name}) = lower(${name})`, sql`${t.people.id} <> ${id}`))
			.get();
		if (!other) {
			tx.update(t.people).set({ name }).where(eq(t.people.id, id)).run();
			return id;
		}
		tx.run(sql`UPDATE OR IGNORE concert_people SET person_id = ${other.id} WHERE person_id = ${id}`);
		tx.delete(t.people).where(eq(t.people.id, id)).run();
		tx.update(t.people).set({ name }).where(eq(t.people.id, other.id)).run();
		return other.id;
	});
}

export function renameEvent(db: DB, id: number, newName: string, notes?: string | null): number {
	const name = clean(newName);
	if (!name) throw new Error('Name must not be empty');
	return db.transaction((tx) => {
		const other = tx
			.select({ id: t.events.id })
			.from(t.events)
			.where(and(sql`lower(${t.events.name}) = lower(${name})`, sql`${t.events.id} <> ${id}`))
			.get();
		if (!other) {
			tx.update(t.events).set({ name, notes: clean(notes) }).where(eq(t.events.id, id)).run();
			return id;
		}
		tx.update(t.concerts).set({ eventId: other.id }).where(eq(t.concerts.eventId, id)).run();
		tx.delete(t.events).where(eq(t.events.id, id)).run();
		return other.id;
	});
}

export function updateVenue(
	db: DB,
	id: number,
	v: { name: string; address: string | null; city: string | null; country: string | null; lat: number | null; lng: number | null; notes: string | null }
) {
	db.update(t.venues)
		.set({
			name: clean(v.name)!,
			address: clean(v.address),
			city: clean(v.city),
			country: clean(v.country),
			lat: v.lat,
			lng: v.lng,
			notes: clean(v.notes)
		})
		.where(eq(t.venues.id, id))
		.run();
}

/** Move all concerts from one venue to another and delete the first. */
export function mergeVenue(db: DB, fromId: number, intoId: number) {
	if (fromId === intoId) return;
	db.transaction((tx) => {
		tx.update(t.concerts).set({ venueId: intoId }).where(eq(t.concerts.venueId, fromId)).run();
		tx.delete(t.venues).where(eq(t.venues.id, fromId)).run();
	});
}

export function deleteVenueIfUnused(db: DB, id: number): boolean {
	const used = db.$client.prepare(`SELECT 1 FROM concerts WHERE venue_id = ? LIMIT 1`).get(id);
	if (used) return false;
	db.delete(t.venues).where(eq(t.venues.id, id)).run();
	return true;
}
