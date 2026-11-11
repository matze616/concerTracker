import { db } from '#lib/server/db/index.ts';
import { allEventsRanked } from '#lib/server/stats.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ events: allEventsRanked(db()) });
