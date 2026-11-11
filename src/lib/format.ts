// Formatting helpers usable on both server and client (fixed locale avoids hydration mismatches).
export const LOCALE = 'de-DE';

/** Number with German separators (1.234,5). `digits` fixes the number of decimals. */
export function num(n: number, digits?: number): string {
	return n.toLocaleString(LOCALE, digits == null ? undefined : { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatDate(iso: string | null | undefined, style: 'long' | 'short' = 'long'): string {
	if (!iso) return '–';
	const [y, m, d] = iso.split('-');
	const date = `${d}.${m}.${y}`; // German format DD.MM.YYYY
	if (style === 'short') return date;
	const weekday = WEEKDAYS[(new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7];
	return `${weekday} ${date}`;
}

export function money(cents: number | null | undefined, currency = 'EUR'): string {
	if (cents == null) return '–';
	return (cents / 100).toLocaleString(LOCALE, { style: 'currency', currency });
}

export function plural(n: number, one: string, many = one + 's'): string {
	return `${num(n)} ${n === 1 ? one : many}`;
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
