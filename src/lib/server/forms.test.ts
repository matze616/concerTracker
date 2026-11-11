import { describe, expect, it } from 'vitest';
import { parseConcertForm } from './forms';

describe('parseConcertForm', () => {
	it('turns the festival-style form order (headliner first) into running order', () => {
		const fd = new FormData();
		fd.set(
			'payload',
			JSON.stringify({
				date: '2014-11-08',
				venueId: null,
				venueName: 'Club',
				bands: [
					{ name: 'Headliner', headliner: true },
					{ name: 'Support', headliner: false },
					{ name: 'Opener', headliner: false }
				],
				people: [],
				price: '',
				currency: 'EUR',
				rating: null
			})
		);
		const r = parseConcertForm(fd);
		expect(r.ok && r.input.bands.map((b) => b.name)).toEqual(['Opener', 'Support', 'Headliner']);
	});
});
