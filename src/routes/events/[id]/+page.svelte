<script lang="ts">
	import RenameForm from '#lib/components/RenameForm.svelte';
	import Stat from '#lib/components/Stat.svelte';
	import { formatDate, money } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const s = $derived(data.stats);
	const byYear = $derived(
		Object.entries(Object.groupBy(data.concerts, (c) => c.date.slice(0, 4))).sort(([a], [b]) => b.localeCompare(a))
	);
</script>

<svelte:head><title>{data.event.name} · Concert Tracker</title></svelte:head>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<h1 class="h1">{data.event.name}</h1>
	<RenameForm name={data.event.name} what="event" error={form?.error} />
</div>

<div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
	<Stat label="Editions" value={s.editions} sub="{formatDate(s.firstDate, 'short')} – {formatDate(s.lastDate, 'short')}" />
	<Stat label="Days attended" value={s.days} />
	<Stat label="Bands seen" value={s.bands} />
	<Stat label="Spent" value={money(s.spentCents)} />
</div>

<div class="space-y-4">
	{#each byYear as [year, days] (year)}
		<section class="card">
			<h2 class="h2">{year}</h2>
			<div class="grid gap-4 md:grid-cols-3">
				{#each days ?? [] as c (c.id)}
					<div>
						<a class="link font-medium" href="/concerts/{c.id}">{formatDate(c.date)}</a>
						<p class="text-xs muted">{c.venueName}{c.people.length ? ` · with ${c.people.map((p) => p.name).join(', ')}` : ''}</p>
						<ul class="mt-1 text-sm">
							{#each [...c.bands].reverse() as b (b.id)}
								<li><a class="hover:underline {b.isHeadliner ? 'font-semibold' : 'text-ink-2'}" href="/bands/{b.id}">{b.name}</a></li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
