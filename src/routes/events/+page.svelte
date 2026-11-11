<script lang="ts">
	import EntityTable from '#lib/components/EntityTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const rows = $derived(data.events.map((e) => ({ ...e, type: e.isFestival ? 'Festival' : 'Tour / event' })));
</script>

<svelte:head><title>Tours &amp; festivals · Concert Tracker</title></svelte:head>
<h1 class="h1 mb-1">Tours &amp; festivals</h1>
<p class="mb-4 muted">
	Fill in “Tour / festival” when adding a concert to group tour stops or festival days. Tick “This is a festival” for festivals.
</p>
<EntityTable
	{rows}
	href={(r) => `/events/${r.id}`}
	searchKeys={['name', 'type']}
	initialSort="concerts"
	columns={[
		{ key: 'name', label: 'Name' },
		{ key: 'type', label: 'Type' },
		{ key: 'concerts', label: 'Concerts', num: true },
		{ key: 'days', label: 'Days', num: true },
		{ key: 'years', label: 'Years', num: true },
		{ key: 'bands', label: 'Bands', num: true }
	]}
>
	{#snippet empty()}<p class="muted">No tours or festivals yet.</p>{/snippet}
</EntityTable>
