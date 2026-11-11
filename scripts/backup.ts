// Creates a consistent copy of the database in backups/ (ignored by Git).
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { databasePath } from '../src/lib/server/db/client';

const src = databasePath();
if (!existsSync(src)) {
	console.error(`No database found at ${src}`);
	process.exit(1);
}
const dir = resolve(process.cwd(), process.env.BACKUP_DIR || 'backups');
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const target = join(dir, `concerts-${stamp}.db`);

const db = new Database(src, { readonly: true });
await db.backup(target);
db.close();

const count = readdirSync(dir).filter((f) => f.endsWith('.db')).length;
console.log(`✔ Backup written: ${target}  (${count} backups in ${dir})`);
