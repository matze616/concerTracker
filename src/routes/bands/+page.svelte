<script lang="ts">
	import EntityTable from '#lib/components/EntityTable.svelte';
	import { formatDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Bands · Concert Tracker</title></svelte:head>
<h1 class="h1 mb-4">Bands <span class="text-base font-normal muted">({data.bands.length})</span></h1>
<EntityTable
	rows={data.bands}
	href={(r) => `/bands/${r.id}`}
	searchKeys={['name']}
	initialSort="times"
	columns={[
		{ key: 'name', label: 'Band' },
		{ key: 'times', label: 'Seen', num: true },
		{ key: 'headlined', label: 'As headliner', num: true },
		{ key: 'firstDate', label: 'First time', format: (r) => formatDate(r.firstDate, 'short') },
		{ key: 'lastDate', label: 'Last time', format: (r) => formatDate(r.lastDate, 'short') }
	]}
/>
