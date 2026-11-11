import { basename } from 'node:path';
import { databasePath } from '#lib/server/db/client.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	const file = basename(databasePath());
	return { dbFile: file, demo: file.includes('demo') };
};
