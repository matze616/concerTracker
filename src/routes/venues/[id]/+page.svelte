<script lang="ts">
	import ConcertList from '#lib/components/ConcertList.svelte';
	import RankList from '#lib/components/RankList.svelte';
	import Stat from '#lib/components/Stat.svelte';
	import VenueMap from '#lib/components/VenueMap.svelte';
	import { formatDate, money, venueLabel } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const v = $derived(data.venue);
	const s = $derived(data.stats.summary);
	let editing = $state(false);
	// svelte-ignore state_referenced_locally
	let lat = $state(data.venue.lat?.toFixed(6) ?? '');
	// svelte-ignore state_referenced_locally
	let lng = $state(data.venue.lng?.toFixed(6) ?? '');
</script>

<svelte:head><title>{v.name} · Concert Tracker</title></svelte:head>

{#if data.notice}<p class="mb-4 rounded-lg border border-line bg-surface-2 p-3 text-sm">{data.notice}</p>{/if}
{#if form?.error}<p class="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{form.error}</p>{/if}

<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">{v.name}</h1>
		<p class="text-ink-2">{[v.address, v.city, v.country].filter(Boolean).join(', ') || 'No address yet'}</p>
	</div>
	<div class="flex gap-2">
		<button class="btn" onclick={() => (editing = !editing)}>{editing ? 'Close editor' : 'Edit venue'}</button>
		<form method="POST" action="?/geocode"><button class="btn" title="Look up coordinates on OpenStreetMap">Find location</button></form>
	</div>
</div>

{#if editing}
	<section class="card mb-4 space-y-4">
		<form method="POST" action="?/save" class="grid gap-3 md:grid-cols-2">
			<div><label class="label" for="vn">Name</label><input id="vn" class="input" name="name" value={v.name} required /></div>
			<div><label class="label" for="va">Address</label><input id="va" class="input" name="address" value={v.address ?? ''} /></div>
			<div><label class="label" for="vc">City</label><input id="vc" class="input" name="city" value={v.city ?? ''} /></div>
			<div><label class="label" for="vco">Country</label><input id="vco" class="input" name="country" value={v.country ?? ''} /></div>
			<div class="md:col-span-2">
				<span class="label">Location <span class="font-normal muted">– click the map or drag the marker</span></span>
				<VenueMap points={[v]} height={280} onpick={(a, b) => ((lat = a.toFixed(6)), (lng = b.toFixed(6)))} />
			</div>
			<div><label class="label" for="vlat">Latitude</label><input id="vlat" class="input" name="lat" bind:value={lat} /></div>
			<div><label class="label" for="vlng">Longitude</label><input id="vlng" class="input" name="lng" bind:value={lng} /></div>
			<div class="md:col-span-2"><label class="label" for="vno">Notes</label><textarea id="vno" class="input" name="notes">{v.notes ?? ''}</textarea></div>
			<div class="md:col-span-2"><button class="btn btn-primary">Save venue</button></div>
		</form>
		<hr class="border-line" />
		<div class="flex flex-wrap items-end gap-6">
			{#if data.others.length}
				<form
					method="POST"
					action="?/merge"
					class="flex flex-wrap items-end gap-2"
					onsubmit={(e) => {
						if (!confirm(`Move all concerts of “${v.name}” to the selected venue and delete “${v.name}”?`)) e.preventDefault();
					}}
				>
					<div>
						<label class="label" for="into">Duplicate? Merge into</label>
						<select id="into" class="input" name="into">
							{#each data.others as o (o.id)}<option value={o.id}>{venueLabel(o)}</option>{/each}
						</select>
					</div>
					<button class="btn">Merge</button>
				</form>
			{/if}
			{#if s.visits === 0}
				<form method="POST" action="?/delete"><button class="btn btn-danger">Delete venue</button></form>
			{/if}
		</div>
	</section>
{:else if v.lat != null}
	<div class="mb-4"><VenueMap points={[{ ...v, visits: s.visits }]} height={220} /></div>
{/if}

<div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
	<Stat label="Visits" value={s.visits} />
	<Stat label="Different bands" value={s.bands} />
	<Stat label="First / last visit" value={formatDate(s.firstDate, 'short')} sub={formatDate(s.lastDate, 'short')} />
	<Stat label="Spent here" value={money(s.spentCents)} />
</div>

<div class="grid gap-4 md:grid-cols-[2fr_1fr]">
	<section class="card py-2">
		<h2 class="h2 mt-2">Concerts here</h2>
		<ConcertList concerts={data.concerts} hideVenue />
	</section>
	<div class="space-y-4">
		<section class="card">
			<h2 class="h2">Bands seen here</h2>
			<RankList items={data.stats.bands.map((b) => ({ href: `/bands/${b.id}`, label: b.name, value: b.times, valueLabel: `${b.times}×` }))} />
		</section>
		<section class="card">
			<h2 class="h2">Who came along</h2>
			<RankList emptyText="Always alone." items={data.stats.companions.map((p) => ({ href: `/people/${p.id}`, label: p.name, value: p.times, valueLabel: `${p.times}×` }))} />
		</section>
	</div>
</div>
