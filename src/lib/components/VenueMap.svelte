<script lang="ts">
	// Leaflet map with OpenStreetMap tiles. Marker size grows with number of visits.
	// With `onpick`, clicking the map or dragging the marker reports new coordinates.
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	interface Point {
		id: number;
		name: string;
		city: string | null;
		lat: number | null;
		lng: number | null;
		visits?: number;
	}

	let {
		points,
		height = 420,
		onpick
	}: { points: Point[]; height?: number; onpick?: (lat: number, lng: number) => void } = $props();

	let el: HTMLDivElement;

	onMount(() => {
		let map: import('leaflet').Map | undefined;
		let cancelled = false;
		import('leaflet').then(({ default: L }) => {
			if (cancelled) return;
			map = L.map(el, { scrollWheelZoom: false });
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);

			const located = points.filter((p) => p.lat != null && p.lng != null);
			const accent = getComputedStyle(document.documentElement).getPropertyValue('--series-1').trim();
			const max = Math.max(1, ...located.map((p) => p.visits ?? 1));

			if (onpick) {
				// single draggable marker for editing one venue
				const start = located[0] ? L.latLng(located[0].lat!, located[0].lng!) : L.latLng(51.16, 10.45);
				const marker = L.marker(start, {
					draggable: true,
					icon: L.divIcon({
						className: '',
						html: `<div style="width:18px;height:18px;border-radius:50%;background:${accent};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
						iconSize: [18, 18],
						iconAnchor: [9, 9]
					})
				}).addTo(map);
				map.setView(start, located[0] ? 16 : 5);
				marker.on('dragend', () => {
					const ll = marker.getLatLng();
					onpick(ll.lat, ll.lng);
				});
				map.on('click', (e) => {
					marker.setLatLng(e.latlng);
					onpick(e.latlng.lat, e.latlng.lng);
				});
				return;
			}

			for (const p of located) {
				const r = 6 + 14 * Math.sqrt((p.visits ?? 1) / max);
				L.circleMarker([p.lat!, p.lng!], {
					radius: r,
					color: '#ffffff',
					weight: 2,
					fillColor: accent,
					fillOpacity: 0.85
				})
					.bindTooltip(`<strong>${escape(p.name)}</strong>${p.city ? `, ${escape(p.city)}` : ''}<br>${p.visits ?? 0} visit${p.visits === 1 ? '' : 's'}`)
					.on('click', () => (location.href = `/venues/${p.id}`))
					.addTo(map);
			}
			if (located.length) map.fitBounds(L.latLngBounds(located.map((p) => [p.lat!, p.lng!])).pad(0.2), { maxZoom: 14 });
			else map.setView([51.16, 10.45], 5);
		});
		return () => {
			cancelled = true;
			map?.remove();
		};
	});

	function escape(s: string) {
		return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
	}
</script>

<div bind:this={el} style="height: {height}px" class="z-0 overflow-hidden rounded-lg border border-line"></div>
