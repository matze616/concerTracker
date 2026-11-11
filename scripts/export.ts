// Writes CSV and JSON exports into exports/ (ignored by Git).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { databasePath, openDb } from '../src/lib/server/db/client';
import { toCsv, toJson } from '../src/lib/server/export';

const db = openDb(databasePath());
const dir = resolve(process.cwd(), 'exports');
mkdirSync(dir, { recursive: true });
const day = new Date().toISOString().slice(0, 10);
writeFileSync(join(dir, `concerts-${day}.csv`), toCsv(db));
writeFileSync(join(dir, `concerts-${day}.json`), toJson(db));
db.$client.close();
console.log(`✔ Exported to ${dir}/concerts-${day}.{csv,json}`);
