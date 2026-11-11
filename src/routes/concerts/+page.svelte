<script lang="ts">
	import { page } from '$app/state';
	import ConcertList from '#lib/components/ConcertList.svelte';
	import { plural } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function without(key: string) {
		const u = new URL(page.url.href);
		u.searchParams.delete(key);
		return u.pathname + u.search;
	}
</script>

<svelte:head><title>Concerts · Concert Tracker</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<h1 class="h1">Concerts</h1>
	<a class="btn btn-primary" href="/concerts/new">+ Add concert</a>
</div>

<form class="mb-4 flex flex-wrap gap-2" data-sveltekit-keepfocus data-sveltekit-replacestate>
	{#each data.active as f (f.key)}
		<input type="hidden" name={f.key} value={page.url.searchParams.get(f.key)} />
	{/each}
	<input
		class="input max-w-xs"
		type="search"
		name="q"
		placeholder="Search bands, venues, people, notes…"
		value={data.filter.q ?? ''}
		oninput={(e) => e.currentTarget.form?.requestSubmit()}
	/>
	<select class="input w-auto" name="year" value={data.filter.year ?? ''} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="">All years</option>
		{#each data.years as y (y)}<option value={y}>{y}</option>{/each}
	</select>
	<noscript><button class="btn">Filter</button></noscript>
</form>

{#if data.active.length}
	<div class="mb-4 flex flex-wrap gap-2">
		{#each data.active as f (f.key)}
			<a class="chip hover:bg-line" href={without(f.key)} title="Remove filter">{f.label} ✕</a>
		{/each}
	</div>
{/if}

<p class="mb-2 text-sm muted">{plural(data.concerts.length, 'concert')}</p>
<div class="card py-1">
	<ConcertList concerts={data.concerts} highlightBand={data.filter.bandId} />
</div>
