<script lang="ts">
	import ConcertList from '#lib/components/ConcertList.svelte';
	import RankList from '#lib/components/RankList.svelte';
	import RenameForm from '#lib/components/RenameForm.svelte';
	import Stat from '#lib/components/Stat.svelte';
	import { formatDate, num } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const s = $derived(data.stats.summary);
</script>

<svelte:head><title>{data.band.name} · Concert Tracker</title></svelte:head>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<h1 class="h1">{data.band.name}</h1>
	<RenameForm name={data.band.name} what="band" error={form?.error} />
</div>

<div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
	<Stat label="Times seen" value={s.times} sub="{s.headlined}× as headliner" />
	<Stat label="First time" value={formatDate(s.firstDate, 'short')} />
	<Stat label="Last time" value={formatDate(s.lastDate, 'short')} />
	<Stat label="Venues" value={s.venues} sub={s.avgRating ? `⌀ rating ${num(s.avgRating, 1)}★` : undefined} />
</div>

<div class="grid gap-4 md:grid-cols-[2fr_1fr]">
	<section class="card py-2">
		<h2 class="h2 mt-2">All shows</h2>
		<ConcertList concerts={data.concerts} highlightBand={data.band.id} />
	</section>
	<div class="space-y-4">
		<section class="card">
			<h2 class="h2">Seen with</h2>
			<RankList emptyText="Always alone." items={data.stats.companions.map((p) => ({ href: `/people/${p.id}`, label: p.name, value: p.times, valueLabel: `${p.times}×` }))} />
		</section>
		<section class="card">
			<h2 class="h2">Where</h2>
			<RankList items={data.stats.venues.map((v) => ({ href: `/venues/${v.id}`, label: v.name, sub: v.city ?? undefined, value: v.times, valueLabel: `${v.times}×` }))} />
		</section>
		<section class="card">
			<h2 class="h2">Shared the bill with</h2>
			<RankList emptyText="Always played alone." items={data.stats.sharedBill.map((b) => ({ href: `/bands/${b.id}`, label: b.name, value: b.times, valueLabel: `${b.times}×` }))} />
		</section>
	</div>
</div>
