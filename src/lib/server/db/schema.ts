import { sql } from 'drizzle-orm';
import {
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	index,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const venues = sqliteTable(
	'venues',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		address: text('address'),
		city: text('city'),
		country: text('country'),
		lat: real('lat'),
		lng: real('lng'),
		notes: text('notes')
	},
	(t) => [uniqueIndex('venues_name_city_uq').on(sql`lower(${t.name})`, sql`lower(coalesce(${t.city}, ''))`)]
);

/** A festival, tour or other event that groups one or more concert days. */
export const events = sqliteTable(
	'events',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		/** Festival (counts days, shown under Festivals) vs. tour or other event */
		isFestival: integer('is_festival', { mode: 'boolean' }).notNull().default(false),
		notes: text('notes')
	},
	(t) => [uniqueIndex('events_name_uq').on(sql`lower(${t.name})`)]
);

export const concerts = sqliteTable(
	'concerts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		/** ISO date YYYY-MM-DD */
		date: text('date').notNull(),
		venueId: integer('venue_id')
			.notNull()
			.references(() => venues.id, { onDelete: 'restrict' }),
		eventId: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
		/** Price in cents, so sums are exact */
		ticketPriceCents: integer('ticket_price_cents'),
		currency: text('currency').notNull().default('EUR'),
		/** 1–5 */
		rating: integer('rating'),
		notes: text('notes'),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(t) => [index('concerts_date_idx').on(t.date), index('concerts_venue_idx').on(t.venueId)]
);

export const bands = sqliteTable(
	'bands',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull()
	},
	(t) => [uniqueIndex('bands_name_uq').on(sql`lower(${t.name})`)]
);

export const concertBands = sqliteTable(
	'concert_bands',
	{
		concertId: integer('concert_id')
			.notNull()
			.references(() => concerts.id, { onDelete: 'cascade' }),
		bandId: integer('band_id')
			.notNull()
			.references(() => bands.id, { onDelete: 'cascade' }),
		/** Running order, 0 = first on stage */
		position: integer('position').notNull().default(0),
		isHeadliner: integer('is_headliner', { mode: 'boolean' }).notNull().default(false)
	},
	(t) => [primaryKey({ columns: [t.concertId, t.bandId] }), index('concert_bands_band_idx').on(t.bandId)]
);

export const people = sqliteTable(
	'people',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull()
	},
	(t) => [uniqueIndex('people_name_uq').on(sql`lower(${t.name})`)]
);

export const concertPeople = sqliteTable(
	'concert_people',
	{
		concertId: integer('concert_id')
			.notNull()
			.references(() => concerts.id, { onDelete: 'cascade' }),
		personId: integer('person_id')
			.notNull()
			.references(() => people.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.concertId, t.personId] }), index('concert_people_person_idx').on(t.personId)]
);

export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Concert = typeof concerts.$inferSelect;
export type Band = typeof bands.$inferSelect;
export type Person = typeof people.$inferSelect;
