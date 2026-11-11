<script lang="ts">
	import { formatDate, money } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const c = $derived(data.concert);
	const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th'}`;
</script>

<svelte:head><title>{c.bands.at(-1)?.name ?? 'Concert'} · {c.date} · Concert Tracker</title></svelte:head>

{#if data.notice}
	<p class="mb-4 rounded-lg border border-line bg-surface-2 p-3 text-sm">{data.notice}</p>
{/if}

<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
	<div>
		<p class="muted">{formatDate(c.date)}</p>
		<h1 class="h1">{c.bands.filter((b) => b.isHeadliner).map((b) => b.name).join(' & ') || c.bands.at(-1)?.name}</h1>
		<p class="text-ink-2">
			<a class="link" href="/venues/{c.venueId}">{c.venueName}</a>{c.city ? `, ${c.city}` : ''}{c.country ? `, ${c.country}` : ''}
			{#if c.eventName}· <a class="link" href="/events/{c.eventId}">{c.eventName}</a>{/if}
		</p>
	</div>
	<div class="flex flex-wrap gap-2">
		<a class="btn" href="/concerts/{c.id}/edit">Edit</a>
		<a class="btn" href="/concerts/new?from={c.id}" title="Same venue, event and people, the following day">+ Next day</a>
		<form
			method="POST"
			action="?/delete"
			onsubmit={(e) => {
				if (!confirm('Delete this concert? This cannot be undone.')) e.preventDefault();
			}}
		>
			<button class="btn btn-danger">Delete</button>
		</form>
	</div>
</div>

<div class="grid gap-4 md:grid-cols-[2fr_1fr]">
	<section class="card">
		<h2 class="h2">Running order</h2>
		<ol class="space-y-2">
			{#each c.bands as b, i (b.id)}
				<li class="flex items-baseline justify-between gap-3">
					<span>
						<span class="mr-2 inline-block w-5 text-right tabular-nums muted">{i + 1}.</span>
						<a class="link {b.isHeadliner ? 'font-semibold' : ''}" href="/bands/{b.id}">{b.name}</a>
						{#if b.isHeadliner}<span class="chip ml-1 text-xs">Headliner</span>{/if}
					</span>
					<span class="text-sm muted">{ordinal(data.timesSeen[b.id] ?? 1)} time</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="card space-y-3 text-sm">
		<div>
			<p class="muted">With</p>
			{#if c.people.length}
				<p>{#each c.people as p, i (p.id)}<a class="link" href="/people/{p.id}">{p.name}</a>{i < c.people.length - 1 ? ', ' : ''}{/each}</p>
			{:else}<p>Went alone</p>{/if}
		</div>
		<div>
			<p class="muted">Ticket</p>
			<p>{money(c.ticketPriceCents, c.currency)}</p>
		</div>
		{#if data.venue.address}
			<div>
				<p class="muted">Address</p>
				<p>{data.venue.address}</p>
			</div>
		{/if}
	</section>
</div>

{#if c.notes}
	<section class="card mt-4">
		<h2 class="h2">Notes</h2>
		<p class="whitespace-pre-line">{c.notes}</p>
	</section>
{/if}
