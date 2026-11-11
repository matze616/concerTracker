// Formatting helpers usable on both server and client (fixed locale avoids hydration mismatches).
const LOCALE = 'en-GB';

export function formatDate(iso: string | null | undefined, style: 'long' | 'short' = 'long'): string {
	if (!iso) return '–';
	const d = new Date(iso + 'T12:00:00Z');
	return d.toLocaleDateString(LOCALE, {
		timeZone: 'UTC',
		weekday: style === 'long' ? 'short' : undefined,
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function money(cents: number | null | undefined, currency = 'EUR'): string {
	if (cents == null) return '–';
	return (cents / 100).toLocaleString(LOCALE, { style: 'currency', currency });
}

export function plural(n: number, one: string, many = one + 's'): string {
	return `${n.toLocaleString(LOCALE)} ${n === 1 ? one : many}`;
}

export function yearsBetween(from: string | null, to: string | null): string {
	if (!from || !to) return '';
	const a = from.slice(0, 4);
	const b = to.slice(0, 4);
	return a === b ? a : `${a}–${b}`;
}

export function stars(rating: number | null | undefined): string {
	if (!rating) return '';
	return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export function venueLabel(v: { name: string; city?: string | null }): string {
	return v.city ? `${v.name} — ${v.city}` : v.name;
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function todayIso(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
