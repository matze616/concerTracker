import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export const MIGRATIONS_FOLDER = resolve(process.cwd(), 'drizzle');

/** Open (and create if needed) a SQLite database and bring its schema up to date. */
export function openDb(path: string): DB {
	if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
	const sqlite = new Database(path);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema }) as DB;
	migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
	return db;
}

export function databasePath(): string {
	if (!process.env.DATABASE_PATH && existsSync('.env')) {
		try {
			process.loadEnvFile('.env');
		} catch {
			/* ignore malformed .env */
		}
	}
	return resolve(process.cwd(), process.env.DATABASE_PATH || 'data/concerts.db');
}
