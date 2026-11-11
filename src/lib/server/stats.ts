import type { DB } from './db/client';

const all = <T>(db: DB, sql: string, ...params: unknown[]) =>
	db.$client.prepare(sql).all(...params) as T[];
const get = <T>(db: DB, sql: string, ...params: unknown[]) =>
	db.$client.prepare(sql).get(...params) as T;

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface Overview {
	concerts: number;
	bands: number;
	bandAppearances: number;
	venues: number;
	cities: number;
	countries: number;
	people: number;
	events: number;
	firstDate: string | null;
	lastDate: string | null;
	totalSpentCents: number;
	pricedConcerts: number;
	avgPriceCents: number | null;
	avgRating: number | null;
	soloConcerts: number;
	avgBandsPerConcert: number | null;
}

export function overview(db: DB): Overview {
	return get<Overview>(
		db,
		`SELECT
			(SELECT count(*) FROM concerts) AS concerts,
			(SELECT count(DISTINCT band_id) FROM concert_bands) AS bands,
			(SELECT count(*) FROM concert_bands) AS bandAppearances,
			(SELECT count(DISTINCT venue_id) FROM concerts) AS venues,
			(SELECT count(DISTINCT lower(v.city)) FROM concerts c JOIN venues v ON v.id = c.venue_id WHERE v.city IS NOT NULL) AS cities,
			(SELECT count(DISTINCT lower(v.country)) FROM concerts c JOIN venues v ON v.id = c.venue_id WHERE v.country IS NOT NULL) AS countries,
			(SELECT count(DISTINCT person_id) FROM concert_people) AS people,
			(SELECT count(DISTINCT event_id) FROM concerts WHERE event_id IS NOT NULL) AS events,
			(SELECT min(date) FROM concerts) AS firstDate,
			(SELECT max(date) FROM concerts) AS lastDate,
			(SELECT coalesce(sum(ticket_price_cents), 0) FROM concerts) AS totalSpentCents,
			(SELECT count(ticket_price_cents) FROM concerts) AS pricedConcerts,
			(SELECT round(avg(ticket_price_cents)) FROM concerts) AS avgPriceCents,
			(SELECT round(avg(rating), 2) FROM concerts) AS avgRating,
			(SELECT count(*) FROM concerts WHERE id NOT IN (SELECT concert_id FROM concert_people)) AS soloConcerts,
			(SELECT round(avg(n), 2) FROM (SELECT count(*) AS n FROM concert_bands GROUP BY concert_id)) AS avgBandsPerConcert`
	);
}

// ---------------------------------------------------------------------------
// Over time
// ---------------------------------------------------------------------------

export interface YearRow {
	year: string;
	concerts: number;
	bandAppearances: number;
	newBands: number;
	spentCents: number;
}

/** One row per year from the first concert year to the last, including empty years. */
export function perYear(db: DB): YearRow[] {
	const rows = all<YearRow>(
		db,
		`WITH first_seen AS (
			SELECT cb.band_id, min(c.date) AS first_date
			FROM concert_bands cb JOIN concerts c ON c.id = cb.concert_id
			GROUP BY cb.band_id
		)
		SELECT substr(c.date, 1, 4) AS year,
			count(DISTINCT c.id) AS concerts,
			(SELECT count(*) FROM concert_bands cb JOIN concerts c2 ON c2.id = cb.concert_id WHERE substr(c2.date,1,4) = substr(c.date,1,4)) AS bandAppearances,
			(SELECT count(*) FROM first_seen WHERE substr(first_date,1,4) = substr(c.date,1,4)) AS newBands,
			coalesce(sum(c.ticket_price_cents), 0) AS spentCents
		FROM concerts c
		GROUP BY year
		ORDER BY year`
	);
	if (rows.length === 0) return rows;
	const byYear = new Map(rows.map((r) => [r.year, r]));
	const out: YearRow[] = [];
	for (let y = Number(rows[0].year); y <= Number(rows[rows.length - 1].year); y++) {
		const key = String(y);
		out.push(byYear.get(key) ?? { year: key, concerts: 0, bandAppearances: 0, newBands: 0, spentCents: 0 });
	}
	return out;
}

/** Concerts per calendar month (index 0 = January), across all years. */
export function perMonth(db: DB): number[] {
	const rows = all<{ m: number; n: number }>(
		db,
		`SELECT cast(substr(date, 6, 2) AS integer) AS m, count(*) AS n FROM concerts GROUP BY m`
	);
	const out = Array(12).fill(0);
	for (const r of rows) out[r.m - 1] = r.n;
	return out;
}

/** Concerts per weekday, Monday first. */
export function perWeekday(db: DB): number[] {
	const rows = all<{ d: number; n: number }>(
		db,
		`SELECT cast(strftime('%w', date) AS integer) AS d, count(*) AS n FROM concerts GROUP BY d`
	);
	const out = Array(7).fill(0);
	for (const r of rows) out[(r.d + 6) % 7] = r.n; // sqlite: 0 = Sunday
	return out;
}

export function busiestMonths(db: DB, limit = 5) {
	return all<{ month: string; concerts: number }>(
		db,
		`SELECT substr(date, 1, 7) AS month, count(*) AS concerts FROM concerts
		 GROUP BY month ORDER BY concerts DESC, month DESC LIMIT ?`,
		limit
	);
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

export interface BandRank {
	id: number;
	name: string;
	times: number;
	headlined: number;
	firstDate: string;
	lastDate: string;
}

export function topBands(db: DB, limit = 10): BandRank[] {
	return all<BandRank>(
		db,
		`SELECT b.id, b.name, count(*) AS times, sum(cb.is_headliner) AS headlined,
		        min(c.date) AS firstDate, max(c.date) AS lastDate
		 FROM concert_bands cb JOIN bands b ON b.id = cb.band_id JOIN concerts c ON c.id = cb.concert_id
		 GROUP BY b.id ORDER BY times DESC, lastDate DESC, b.name COLLATE NOCASE LIMIT ?`,
		limit
	);
}

export interface VenueRank {
	id: number;
	name: string;
	city: string | null;
	country: string | null;
	lat: number | null;
	lng: number | null;
	visits: number;
	firstDate: string;
	lastDate: string;
	spentCents: number;
}

export function topVenues(db: DB, limit = 10): VenueRank[] {
	return all<VenueRank>(
		db,
		`SELECT v.id, v.name, v.city, v.country, v.lat, v.lng, count(*) AS visits,
		        min(c.date) AS firstDate, max(c.date) AS lastDate, coalesce(sum(c.ticket_price_cents), 0) AS spentCents
		 FROM concerts c JOIN venues v ON v.id = c.venue_id
		 GROUP BY v.id ORDER BY visits DESC, lastDate DESC LIMIT ?`,
		limit
	);
}

export interface PersonRank {
	id: number;
	name: string;
	concerts: number;
	firstDate: string;
	lastDate: string;
}

export function topPeople(db: DB, limit = 10): PersonRank[] {
	return all<PersonRank>(
		db,
		`SELECT p.id, p.name, count(*) AS concerts, min(c.date) AS firstDate, max(c.date) AS lastDate
		 FROM concert_people cp JOIN people p ON p.id = cp.person_id JOIN concerts c ON c.id = cp.concert_id
		 GROUP BY p.id ORDER BY concerts DESC, lastDate DESC LIMIT ?`,
		limit
	);
}

export function topCities(db: DB, limit = 10) {
	return all<{ city: string; country: string | null; concerts: number; venues: number }>(
		db,
		`SELECT v.city AS city, max(v.country) AS country, count(*) AS concerts, count(DISTINCT v.id) AS venues
		 FROM concerts c JOIN venues v ON v.id = c.venue_id WHERE v.city IS NOT NULL
		 GROUP BY lower(v.city) ORDER BY concerts DESC LIMIT ?`,
		limit
	);
}

export function topCountries(db: DB, limit = 10) {
	return all<{ country: string; concerts: number; cities: number }>(
		db,
		`SELECT v.country AS country, count(*) AS concerts, count(DISTINCT lower(v.city)) AS cities
		 FROM concerts c JOIN venues v ON v.id = c.venue_id WHERE v.country IS NOT NULL
		 GROUP BY lower(v.country) ORDER BY concerts DESC LIMIT ?`,
		limit
	);
}

export function topEvents(db: DB, limit = 10) {
	return all<{ id: number; name: string; days: number; years: number; bands: number }>(
		db,
		`SELECT e.id, e.name, count(DISTINCT c.date) AS days, count(DISTINCT substr(c.date,1,4)) AS years,
		        (SELECT count(DISTINCT cb.band_id) FROM concert_bands cb JOIN concerts c2 ON c2.id = cb.concert_id WHERE c2.event_id = e.id) AS bands
		 FROM events e JOIN concerts c ON c.event_id = e.id
		 GROUP BY e.id ORDER BY days DESC LIMIT ?`,
		limit
	);
}

/** Bands with the longest pause between two consecutive times you saw them. */
export function longestGaps(db: DB, limit = 5) {
	return all<{ id: number; name: string; fromDate: string; toDate: string; days: number }>(
		db,
		`WITH seen AS (
			SELECT DISTINCT cb.band_id, c.date FROM concert_bands cb JOIN concerts c ON c.id = cb.concert_id
		), gaps AS (
			SELECT band_id, lag(date) OVER (PARTITION BY band_id ORDER BY date) AS fromDate, date AS toDate
			FROM seen
		)
		SELECT b.id, b.name, g.fromDate, g.toDate,
		       cast(julianday(g.toDate) - julianday(g.fromDate) AS integer) AS days
		FROM gaps g JOIN bands b ON b.id = g.band_id
		WHERE g.fromDate IS NOT NULL
		ORDER BY days DESC LIMIT ?`,
		limit
	);
}

/** Best rated bands (average concert rating when they played, at least `minRatings` rated concerts). */
export function topRatedBands(db: DB, limit = 5, minRatings = 2) {
	return all<{ id: number; name: string; avgRating: number; rated: number }>(
		db,
		`SELECT b.id, b.name, round(avg(c.rating), 2) AS avgRating, count(c.rating) AS rated
		 FROM concert_bands cb JOIN bands b ON b.id = cb.band_id JOIN concerts c ON c.id = cb.concert_id
		 WHERE c.rating IS NOT NULL
		 GROUP BY b.id HAVING rated >= ? ORDER BY avgRating DESC, rated DESC LIMIT ?`,
		minRatings,
		limit
	);
}

/** Concerts that happened on this calendar day in earlier years. */
export function onThisDay(db: DB, isoToday: string) {
	const mmdd = isoToday.slice(5, 10);
	return all<{ id: number; date: string; venueName: string; bands: string }>(
		db,
		`SELECT c.id, c.date, v.name AS venueName,
		        (SELECT group_concat(b.name, ', ') FROM (SELECT b.name FROM concert_bands cb JOIN bands b ON b.id = cb.band_id WHERE cb.concert_id = c.id ORDER BY cb.position DESC) b) AS bands
		 FROM concerts c JOIN venues v ON v.id = c.venue_id
		 WHERE substr(c.date, 6, 5) = ? AND c.date < ?
		 ORDER BY c.date DESC`,
		mmdd,
		isoToday
	);
}

// ---------------------------------------------------------------------------
// Detail pages
// ---------------------------------------------------------------------------

export function bandStats(db: DB, bandId: number) {
	const summary = get<{ times: number; headlined: number; firstDate: string | null; lastDate: string | null; venues: number; avgRating: number | null }>(
		db,
		`SELECT count(*) AS times, coalesce(sum(cb.is_headliner), 0) AS headlined, min(c.date) AS firstDate, max(c.date) AS lastDate,
		        count(DISTINCT c.venue_id) AS venues, round(avg(c.rating), 2) AS avgRating
		 FROM concert_bands cb JOIN concerts c ON c.id = cb.concert_id WHERE cb.band_id = ?`,
		bandId
	);
	const companions = all<{ id: number; name: string; times: number }>(
		db,
		`SELECT p.id, p.name, count(*) AS times
		 FROM concert_bands cb JOIN concert_people cp ON cp.concert_id = cb.concert_id JOIN people p ON p.id = cp.person_id
		 WHERE cb.band_id = ? GROUP BY p.id ORDER BY times DESC, p.name COLLATE NOCASE`,
		bandId
	);
	const venues = all<{ id: number; name: string; city: string | null; times: number }>(
		db,
		`SELECT v.id, v.name, v.city, count(*) AS times
		 FROM concert_bands cb JOIN concerts c ON c.id = cb.concert_id JOIN venues v ON v.id = c.venue_id
		 WHERE cb.band_id = ? GROUP BY v.id ORDER BY times DESC`,
		bandId
	);
	const sharedBill = all<{ id: number; name: string; times: number }>(
		db,
		`SELECT b.id, b.name, count(*) AS times
		 FROM concert_bands mine JOIN concert_bands other ON other.concert_id = mine.concert_id AND other.band_id <> mine.band_id
		 JOIN bands b ON b.id = other.band_id
		 WHERE mine.band_id = ? GROUP BY b.id ORDER BY times DESC, b.name COLLATE NOCASE LIMIT 10`,
		bandId
	);
	return { summary, companions, venues, sharedBill };
}

export function venueStats(db: DB, venueId: number) {
	const summary = get<{ visits: number; firstDate: string | null; lastDate: string | null; spentCents: number; bands: number; avgRating: number | null }>(
		db,
		`SELECT count(*) AS visits, min(date) AS firstDate, max(date) AS lastDate,
		        coalesce(sum(ticket_price_cents), 0) AS spentCents, round(avg(rating), 2) AS avgRating,
		        (SELECT count(DISTINCT cb.band_id) FROM concert_bands cb JOIN concerts c2 ON c2.id = cb.concert_id WHERE c2.venue_id = ?) AS bands
		 FROM concerts WHERE venue_id = ?`,
		venueId,
		venueId
	);
	const bands = all<{ id: number; name: string; times: number }>(
		db,
		`SELECT b.id, b.name, count(*) AS times
		 FROM concerts c JOIN concert_bands cb ON cb.concert_id = c.id JOIN bands b ON b.id = cb.band_id
		 WHERE c.venue_id = ? GROUP BY b.id ORDER BY times DESC, b.name COLLATE NOCASE LIMIT 15`,
		venueId
	);
	const companions = all<{ id: number; name: string; times: number }>(
		db,
		`SELECT p.id, p.name, count(*) AS times
		 FROM concerts c JOIN concert_people cp ON cp.concert_id = c.id JOIN people p ON p.id = cp.person_id
		 WHERE c.venue_id = ? GROUP BY p.id ORDER BY times DESC, p.name COLLATE NOCASE`,
		venueId
	);
	return { summary, bands, companions };
}

export function personStats(db: DB, personId: number) {
	const summary = get<{ concerts: number; firstDate: string | null; lastDate: string | null; venues: number; bands: number }>(
		db,
		`SELECT count(*) AS concerts, min(c.date) AS firstDate, max(c.date) AS lastDate, count(DISTINCT c.venue_id) AS venues,
		        (SELECT count(DISTINCT cb.band_id) FROM concert_bands cb JOIN concert_people cp2 ON cp2.concert_id = cb.concert_id WHERE cp2.person_id = ?) AS bands
		 FROM concert_people cp JOIN concerts c ON c.id = cp.concert_id WHERE cp.person_id = ?`,
		personId,
		personId
	);
	const bands = all<{ id: number; name: string; times: number }>(
		db,
		`SELECT b.id, b.name, count(*) AS times
		 FROM concert_people cp JOIN concert_bands cb ON cb.concert_id = cp.concert_id JOIN bands b ON b.id = cb.band_id
		 WHERE cp.person_id = ? GROUP BY b.id ORDER BY times DESC, b.name COLLATE NOCASE LIMIT 15`,
		personId
	);
	const venues = all<{ id: number; name: string; city: string | null; times: number }>(
		db,
		`SELECT v.id, v.name, v.city, count(*) AS times
		 FROM concert_people cp JOIN concerts c ON c.id = cp.concert_id JOIN venues v ON v.id = c.venue_id
		 WHERE cp.person_id = ? GROUP BY v.id ORDER BY times DESC LIMIT 10`,
		personId
	);
	const others = all<{ id: number; name: string; times: number }>(
		db,
		`SELECT p.id, p.name, count(*) AS times
		 FROM concert_people me JOIN concert_people cp ON cp.concert_id = me.concert_id AND cp.person_id <> me.person_id
		 JOIN people p ON p.id = cp.person_id
		 WHERE me.person_id = ? GROUP BY p.id ORDER BY times DESC, p.name COLLATE NOCASE LIMIT 10`,
		personId
	);
	const perYear = all<{ year: string; concerts: number }>(
		db,
		`SELECT substr(c.date,1,4) AS year, count(*) AS concerts
		 FROM concert_people cp JOIN concerts c ON c.id = cp.concert_id WHERE cp.person_id = ?
		 GROUP BY year ORDER BY year`,
		personId
	);
	return { summary, bands, venues, others, perYear };
}

export function eventStats(db: DB, eventId: number) {
	return get<{ days: number; editions: number; firstDate: string | null; lastDate: string | null; bands: number; spentCents: number }>(
		db,
		`SELECT count(DISTINCT date) AS days, count(DISTINCT substr(date,1,4)) AS editions, min(date) AS firstDate, max(date) AS lastDate,
		        coalesce(sum(ticket_price_cents), 0) AS spentCents,
		        (SELECT count(DISTINCT cb.band_id) FROM concert_bands cb JOIN concerts c2 ON c2.id = cb.concert_id WHERE c2.event_id = ?) AS bands
		 FROM concerts WHERE event_id = ?`,
		eventId,
		eventId
	);
}

/** Full lists for the index pages (bands, people, venues, events). */
export function allBandsRanked(db: DB) {
	return topBands(db, 100000);
}
export function allPeopleRanked(db: DB) {
	return topPeople(db, 100000);
}
export function allVenuesRanked(db: DB) {
	return all<VenueRank>(
		db,
		`SELECT v.id, v.name, v.city, v.country, v.lat, v.lng, count(c.id) AS visits,
		        min(c.date) AS firstDate, max(c.date) AS lastDate, coalesce(sum(c.ticket_price_cents), 0) AS spentCents
		 FROM venues v LEFT JOIN concerts c ON c.venue_id = v.id
		 GROUP BY v.id ORDER BY visits DESC, v.name COLLATE NOCASE`
	);
}
export function allEventsRanked(db: DB) {
	return topEvents(db, 100000);
}
