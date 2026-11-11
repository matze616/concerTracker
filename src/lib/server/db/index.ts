import { databasePath, openDb, type DB } from './client';

let instance: DB | undefined;

/** The app's database (opened lazily, migrations run on first use). */
export function db(): DB {
	instance ??= openDb(databasePath());
	return instance;
}

export * as t from './schema';
export type { DB };
