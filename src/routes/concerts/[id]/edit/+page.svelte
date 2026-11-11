<script lang="ts">
	import ConcertForm from '#lib/components/ConcertForm.svelte';
	import { formatDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Edit concert · Concert Tracker</title></svelte:head>

<h1 class="h1 mb-6">Edit concert · {formatDate(data.concert.date)}</h1>
<div class="card max-w-3xl">
	<ConcertForm initial={form?.state ?? data.initial} options={data.options} errors={form?.errors} submitLabel="Save changes" />
</div>
