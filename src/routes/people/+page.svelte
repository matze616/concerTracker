<script lang="ts">
	import EntityTable from '#lib/components/EntityTable.svelte';
	import { formatDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>People · Concert Tracker</title></svelte:head>
<h1 class="h1 mb-4">People <span class="text-base font-normal muted">({data.people.length})</span></h1>
<EntityTable
	rows={data.people}
	href={(r) => `/people/${r.id}`}
	searchKeys={['name']}
	initialSort="concerts"
	columns={[
		{ key: 'name', label: 'Name' },
		{ key: 'concerts', label: 'Concerts together', num: true },
		{ key: 'firstDate', label: 'First', format: (r) => formatDate(r.firstDate, 'short') },
		{ key: 'lastDate', label: 'Last', format: (r) => formatDate(r.lastDate, 'short') }
	]}
/>
