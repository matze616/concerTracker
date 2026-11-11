import { db } from '#lib/server/db/index.ts';
import { toCsv } from '#lib/server/export.ts';
import { todayIso } from '#lib/format.ts';

export const GET = () =>
	new Response(toCsv(db()), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="concerts-${todayIso()}.csv"`
		}
	});
