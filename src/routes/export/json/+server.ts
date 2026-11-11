import { db } from '#lib/server/db/index.ts';
import { toJson } from '#lib/server/export.ts';
import { todayIso } from '#lib/format.ts';

export const GET = () =>
	new Response(toJson(db()), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="concerts-${todayIso()}.json"`
		}
	});
