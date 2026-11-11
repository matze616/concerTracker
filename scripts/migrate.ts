import { databasePath, openDb } from '../src/lib/server/db/client';

const path = databasePath();
openDb(path).$client.close();
console.log(`✔ Database is up to date: ${path}`);
