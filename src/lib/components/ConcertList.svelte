<script lang="ts">
	import { formatDate, money } from '#lib/format.ts';
	import type { ConcertRow } from '#lib/server/repo.ts';

	let {
		concerts,
		hideVenue = false,
		highlightBand
	}: { concerts: ConcertRow[]; hideVenue?: boolean; highlightBand?: number } = $props();
</script>

{#if concerts.length === 0}
	<p class="muted">No concerts yet.</p>
{:else}
	<ul class="divide-y divide-line">
		{#each concerts as c (c.id)}
			<li class="py-3">
				<a href="/concerts/{c.id}" class="group block">
					<div class="flex flex-wrap items-baseline justify-between gap-x-3">
						<span class="font-medium group-hover:text-accent-ink">
							{#each [...c.bands].reverse() as b, i (b.id)}<span
									class={b.isHeadliner ? 'font-semibold' : 'font-normal text-ink-2'}
									class:underline={highlightBand === b.id}>{b.name}</span
								>{i < c.bands.length - 1 ? ' · ' : ''}{/each}
						</span>
						<span class="text-sm tabular-nums muted">{formatDate(c.date)}</span>
					</div>
					<div class="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink-2">
						{#if !hideVenue}<span>{c.venueName}{c.city ? `, ${c.city}` : ''}</span>{/if}
						{#if c.eventName}<span class="muted">{c.eventName}</span>{/if}
						{#if c.people.length}<span class="muted">with {c.people.map((p) => p.name).join(', ')}</span>{/if}
						{#if c.ticketPriceCents != null}<span class="muted">{money(c.ticketPriceCents, c.currency)}</span>{/if}					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}
