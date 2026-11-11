import { db } from '#lib/server/db/index.ts';
import { allVenuesRanked } from '#lib/server/stats.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ venues: allVenuesRanked(db()) });
