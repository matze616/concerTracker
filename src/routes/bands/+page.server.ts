import { db } from '#lib/server/db/index.ts';
import { allBandsRanked } from '#lib/server/stats.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ bands: allBandsRanked(db()) });
