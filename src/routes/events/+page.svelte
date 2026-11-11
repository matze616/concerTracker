<script lang="ts">
	import EntityTable from '#lib/components/EntityTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Festivals · Concert Tracker</title></svelte:head>
<h1 class="h1 mb-1">Festivals &amp; events</h1>
<p class="mb-4 muted">Fill in “Festival / event” when adding a concert to group festival days or tour stops.</p>
<EntityTable
	rows={data.events}
	href={(r) => `/events/${r.id}`}
	searchKeys={['name']}
	initialSort="days"
	columns={[
		{ key: 'name', label: 'Event' },
		{ key: 'days', label: 'Days attended', num: true },
		{ key: 'years', label: 'Editions', num: true },
		{ key: 'bands', label: 'Bands', num: true }
	]}
>
	{#snippet empty()}<p class="muted">No festivals or events yet.</p>{/snippet}
</EntityTable>
