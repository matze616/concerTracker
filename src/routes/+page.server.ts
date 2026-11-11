import { db } from '#lib/server/db/index.ts';
import { listConcerts } from '#lib/server/repo.ts';
import * as stats from '#lib/server/stats.ts';
import { todayIso } from '#lib/format.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const d = db();
	return {
		overview: stats.overview(d),
		perYear: stats.perYear(d),
		perMonth: stats.perMonth(d),
		perWeekday: stats.perWeekday(d),
		topBands: stats.topBands(d, 10),
		topVenues: stats.topVenues(d, 10),
		topPeople: stats.topPeople(d, 10),
		topCities: stats.topCities(d, 8),
		topCountries: stats.topCountries(d, 8),
		topFestivals: stats.topEvents(d, 5, true),
		topTours: stats.topEvents(d, 5, false),
		gaps: stats.longestGaps(d, 5),
		busiestMonths: stats.busiestMonths(d, 3),
		onThisDay: stats.onThisDay(d, todayIso()),
		recent: listConcerts(d, { limit: 5 })
	};
};
