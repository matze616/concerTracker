import { db } from '#lib/server/db/index.ts';
import { allPeopleRanked } from '#lib/server/stats.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ people: allPeopleRanked(db()) });
