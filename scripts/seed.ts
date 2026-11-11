// Fills a SEPARATE demo database with fictional data. Your real database is never touched.
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDb } from '../src/lib/server/db/client';
import { seedDemo } from '../src/lib/server/demo-data';

const path = resolve(process.cwd(), 'data/demo.db');
for (const suffix of ['', '-wal', '-shm']) if (existsSync(path + suffix)) rmSync(path + suffix);
const db = openDb(path);
seedDemo(db);
db.$client.close();
console.log(`✔ Demo database written: ${path}`);
console.log(`  Try it with:  DATABASE_PATH=data/demo.db pnpm dev`);
