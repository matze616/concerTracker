import { beforeEach, describe, expect, it } from 'vitest';
import { openDb, type DB } from './db/client';
import { deleteConcert, getConcert, listConcerts, renameBand, renamePerson, saveConcert } from './repo';
import * as stats from './stats';

const halle = { name: 'Rote Halle', city: 'Hamburg', country: 'Germany' };
const club = { name: 'Kellerclub', city: 'Berlin', country: 'Germany' };

let db: DB;

beforeEach(() => {
	db = openDb(':memory:');
	saveConcert(db, {
		date: '2012-05-04',
		venue: halle,
		bands: [
			{ name: 'Glass Harbor', headliner: false },
			{ name: 'Nordlicht', headliner: true }
		],
		people: ['Anna', 'Ben'],
		ticketPriceCents: 3000,
		rating: 4
	});
	saveConcert(db, {
		date: '2015-05-04',
		venue: { name: 'rote halle', city: 'hamburg' }, // same venue, different case
		bands: [{ name: 'nordlicht', headliner: true }], // same band, different case
		people: ['anna'],
		ticketPriceCents: 4000,
		rating: 5
	});
	saveConcert(db, {
		date: '2015-11-20',
		venue: club,
		event: 'Winter Fest',
		bands: [
			{ name: 'Copper Wolves', headliner: true },
			{ name: 'Glass Harbor', headliner: false }
		],
		people: []
	});
});

describe('overview', () => {
	it('counts concerts, distinct bands, venues and people', () => {
		const o = stats.overview(db);
		expect(o.concerts).toBe(3);
		expect(o.bands).toBe(3);
		expect(o.bandAppearances).toBe(5);
		expect(o.venues).toBe(2);
		expect(o.cities).toBe(2);
		expect(o.countries).toBe(1);
		expect(o.people).toBe(2);
		expect(o.events).toBe(1);
		expect(o.totalSpentCents).toBe(7000);
		expect(o.avgPriceCents).toBe(3500);
		expect(o.soloConcerts).toBe(1);
		expect(o.firstDate).toBe('2012-05-04');
		expect(o.lastDate).toBe('2015-11-20');
	});
});

describe('rankings', () => {
	it('ranks bands by times seen, case-insensitively merged', () => {
		const top = stats.topBands(db);
		expect(top.map((b) => b.times)).toEqual([2, 2, 1]);
		expect(top.find((b) => b.name === 'Nordlicht')).toMatchObject({ times: 2, headlined: 2 });
		expect(top.find((b) => b.name === 'Glass Harbor')).toMatchObject({ times: 2, headlined: 0 });
	});
	it('ranks venues and people', () => {
		expect(stats.topVenues(db)[0]).toMatchObject({ name: 'Rote Halle', visits: 2, spentCents: 7000 });
		expect(stats.topPeople(db)[0]).toMatchObject({ name: 'Anna', concerts: 2 });
	});
	it('finds the longest gap between sightings', () => {
		const g = stats.longestGaps(db, 1)[0];
		expect(g.name).toBe('Glass Harbor');
		expect(g.days).toBe(1295); // 2012-05-04 -> 2015-11-20
	});
});

describe('over time', () => {
	it('fills empty years and counts new bands', () => {
		const y = stats.perYear(db);
		expect(y.map((r) => r.year)).toEqual(['2012', '2013', '2014', '2015']);
		expect(y[0]).toMatchObject({ concerts: 1, newBands: 2 });
		expect(y[1].concerts).toBe(0);
		expect(y[3]).toMatchObject({ concerts: 2, newBands: 1, spentCents: 4000 });
	});
	it('counts per month and weekday', () => {
		expect(stats.perMonth(db)[4]).toBe(2); // May
		expect(stats.perWeekday(db).reduce((a, b) => a + b)).toBe(3);
	});
	it('finds concerts on this day', () => {
		expect(stats.onThisDay(db, '2026-05-04')).toHaveLength(2);
	});
});

describe('detail stats', () => {
	it('band companions and venues', () => {
		const id = stats.topBands(db).find((b) => b.name === 'Nordlicht')!.id;
		const s = stats.bandStats(db, id);
		expect(s.summary.times).toBe(2);
		expect(s.companions[0]).toMatchObject({ name: 'Anna', times: 2 });
		expect(s.sharedBill[0]).toMatchObject({ name: 'Glass Harbor', times: 1 });
	});
});

describe('editing', () => {
	it('merges bands when renamed to an existing name', () => {
		const wolves = stats.topBands(db).find((b) => b.name === 'Copper Wolves')!;
		renameBand(db, wolves.id, 'NORDLICHT');
		expect(stats.overview(db).bands).toBe(2);
		expect(stats.topBands(db)[0]).toMatchObject({ name: 'NORDLICHT', times: 3 });
	});
	it('merges people', () => {
		const ben = stats.topPeople(db).find((p) => p.name === 'Ben')!;
		renamePerson(db, ben.id, 'Anna');
		expect(stats.overview(db).people).toBe(1);
	});
	it('updates lineups and removes orphaned bands on delete', () => {
		const [latest] = listConcerts(db, { limit: 1 });
		expect(latest.eventName).toBe('Winter Fest');
		deleteConcert(db, latest.id);
		expect(getConcert(db, latest.id)).toBeUndefined();
		expect(stats.overview(db)).toMatchObject({ bands: 2, events: 0 });
	});
	it('filters the concert list', () => {
		const anna = stats.topPeople(db)[0];
		expect(listConcerts(db, { personId: anna.id })).toHaveLength(2);
		expect(listConcerts(db, { year: '2015' })).toHaveLength(2);
		expect(listConcerts(db, { q: 'copper' })).toHaveLength(1);
	});
});
