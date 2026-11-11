import { statSync } from 'node:fs';
import { databasePath } from '#lib/server/db/client.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const path = databasePath();
	let size = 0;
	try {
		size = statSync(path).size;
	} catch {
		/* not created yet */
	}
	return { path, size };
};
