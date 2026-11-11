<script lang="ts">
	import ConcertForm from '#lib/components/ConcertForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Add concert · Concert Tracker</title></svelte:head>

<h1 class="h1 mb-1">Add concert</h1>
<p class="mb-6 muted">
	{data.prefill === 'nextDay'
		? 'Next day of the same event – venue, event and people are already filled in.'
		: data.prefill === 'sameDay'
			? 'Same day, another venue – date, bands and people are already filled in.'
			: 'Only date, venue and one band are required.'}
</p>
<div class="card max-w-3xl">
	<ConcertForm initial={form?.state ?? data.initial} options={data.options} errors={form?.errors} />
</div>
