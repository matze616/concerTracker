<script lang="ts">
	import EntityTable from '#lib/components/EntityTable.svelte';
	import VenueMap from '#lib/components/VenueMap.svelte';
	import { formatDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const missing = $derived(data.venues.filter((v) => v.lat == null));
</script>

<svelte:head><title>Venues · Concert Tracker</title></svelte:head>
<h1 class="h1 mb-4">Venues <span class="text-base font-normal muted">({data.venues.length})</span></h1>

{#if data.venues.length}
	<div class="mb-2"><VenueMap points={data.venues} /></div>
	<p class="mb-6 text-xs muted">
		Circle size = number of visits. Click a circle to open the venue.
		{#if missing.length}{missing.length} venue{missing.length > 1 ? 's have' : ' has'} no location yet:
			{#each missing as v, i (v.id)}<a class="link" href="/venues/{v.id}">{v.name}</a>{i < missing.length - 1 ? ', ' : ''}{/each}.{/if}
	</p>
{/if}

<EntityTable
	rows={data.venues}
	href={(r) => `/venues/${r.id}`}
	searchKeys={['name', 'city', 'country']}
	initialSort="visits"
	columns={[
		{ key: 'name', label: 'Venue' },
		{ key: 'city', label: 'City' },
		{ key: 'country', label: 'Country' },
		{ key: 'visits', label: 'Visits', num: true },
		{ key: 'lastDate', label: 'Last visit', format: (r) => formatDate(r.lastDate, 'short') }
	]}
/>
