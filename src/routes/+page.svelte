<script lang="ts">
	import { goto } from '$app/navigation';
	import BarChart from '#lib/components/BarChart.svelte';
	import ConcertList from '#lib/components/ConcertList.svelte';
	import RankList from '#lib/components/RankList.svelte';
	import Stat from '#lib/components/Stat.svelte';
	import { MONTHS, WEEKDAYS, formatDate, money, plural, yearsBetween } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const o = $derived(data.overview);
	const yearsActive = $derived(data.perYear.filter((y) => y.concerts > 0).length);
	const bestYear = $derived([...data.perYear].sort((a, b) => b.concerts - a.concerts)[0]);
	const euro = (v: number) => money(v * 100).replace(/\.00$/, '');
</script>

<svelte:head><title>Overview · Concert Tracker</title></svelte:head>

{#if o.concerts === 0}
	<div class="card mx-auto max-w-xl py-10 text-center">
		<h1 class="h1 mb-2">Welcome!</h1>
		<p class="mb-6 text-ink-2">No concerts yet. Add the first one – statistics appear here as soon as there is data.</p>
		<a class="btn btn-primary" href="/concerts/new">+ Add your first concert</a>
		<p class="mt-6 text-sm muted">Just want to look around? Run <code>pnpm db:seed</code> and start with <code>DATABASE_PATH=data/demo.db pnpm dev</code>.</p>
	</div>
{:else}
	<h1 class="h1 mb-1">Overview</h1>
	<p class="mb-5 muted">
		{plural(o.concerts, 'concert')} from {formatDate(o.firstDate, 'short')} to {formatDate(o.lastDate, 'short')} · {plural(yearsActive, 'active year')}
	</p>

	{#if data.onThisDay.length}
		<section class="card mb-4 border-accent/40">
			<h2 class="h2">On this day</h2>
			<ul class="space-y-1 text-sm">
				{#each data.onThisDay as c (c.id)}
					<li><a class="link" href="/concerts/{c.id}">{c.bands}</a> <span class="muted">at {c.venueName}, {c.date.slice(0, 4)}</span></li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
		<Stat label="Concerts" value={o.concerts} href="/concerts" sub={bestYear ? `most: ${bestYear.concerts} in ${bestYear.year}` : undefined} />
		<Stat label="Different bands" value={o.bands} href="/bands" sub="{plural(o.bandAppearances, 'set')} seen" />
		<Stat label="Venues" value={o.venues} href="/venues" sub="in {plural(o.cities, 'city', 'cities')}" />
		<Stat label="Countries" value={o.countries} />
		<Stat label="Companions" value={o.people} href="/people" sub="{o.soloConcerts} times alone" />
		<Stat
			label="Spent on tickets"
			value={money(o.totalSpentCents)}
			sub={o.avgPriceCents ? `⌀ ${money(o.avgPriceCents)} · ${o.pricedConcerts} priced` : undefined}
		/>
	</div>

	<div class="mb-4 grid items-start gap-4 lg:grid-cols-3">
		<section class="card lg:col-span-2">
			<h2 class="h2">Concerts per year</h2>
			<BarChart
				labels={data.perYear.map((y) => y.year)}
				values={data.perYear.map((y) => y.concerts)}
				label="Concerts"
				onselect={(i) => goto(`/concerts?year=${data.perYear[i].year}`)}
			/>
		</section>
		<section class="card">
			<h2 class="h2">Recently</h2>
			<ConcertList concerts={data.recent} />
		</section>
	</div>

	<div class="mb-4 grid gap-4 md:grid-cols-3">
		<section class="card">
			<h2 class="h2">Most seen bands</h2>
			<RankList items={data.topBands.map((b) => ({ href: `/bands/${b.id}`, label: b.name, sub: yearsBetween(b.firstDate, b.lastDate), value: b.times, valueLabel: `${b.times}×` }))} />
		</section>
		<section class="card">
			<h2 class="h2">Most visited venues</h2>
			<RankList items={data.topVenues.map((v) => ({ href: `/venues/${v.id}`, label: v.name, sub: v.city ?? undefined, value: v.visits, valueLabel: `${v.visits}×` }))} />
		</section>
		<section class="card">
			<h2 class="h2">Concert buddies</h2>
			<RankList
				emptyText="You haven't added any companions yet."
				items={data.topPeople.map((p) => ({ href: `/people/${p.id}`, label: p.name, value: p.concerts, valueLabel: `${p.concerts}×` }))}
			/>
		</section>
	</div>

	<div class="mb-4 grid gap-4 md:grid-cols-2">
		<section class="card">
			<h2 class="h2">New bands per year</h2>
			<BarChart labels={data.perYear.map((y) => y.year)} values={data.perYear.map((y) => y.newBands)} label="Bands seen for the first time" height={180} />
		</section>
		<section class="card">
			<h2 class="h2">Ticket spending per year</h2>
			<BarChart labels={data.perYear.map((y) => y.year)} values={data.perYear.map((y) => y.spentCents / 100)} label="Spent" format={euro} height={180} />
		</section>
		<section class="card">
			<h2 class="h2">By month</h2>
			<BarChart labels={MONTHS} values={data.perMonth} label="Concerts" height={180} />
		</section>
		<section class="card">
			<h2 class="h2">By weekday</h2>
			<BarChart labels={WEEKDAYS} values={data.perWeekday} label="Concerts" height={180} />
		</section>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<section class="card">
			<h2 class="h2">Cities</h2>
			<RankList items={data.topCities.map((c) => ({ href: `/concerts?city=${encodeURIComponent(c.city)}`, label: c.city, sub: c.country ?? undefined, value: c.concerts }))} />
			{#if data.topCountries.length > 1}
				<h2 class="h2 mt-5">Countries</h2>
				<RankList items={data.topCountries.map((c) => ({ href: `/concerts?country=${encodeURIComponent(c.country)}`, label: c.country, value: c.concerts }))} />
			{/if}
		</section>
		<section class="card">
			<h2 class="h2">Longest waits</h2>
			<p class="mb-2 text-xs muted">Longest time between two shows of the same band</p>
			{#if data.gaps.length}
				<ul class="space-y-1.5 text-sm">
					{#each data.gaps as g (g.id + g.toDate)}
						<li>
							<a class="link" href="/bands/{g.id}">{g.name}</a>
							<span class="muted">· {(g.days / 365.25).toFixed(1)} years ({g.fromDate.slice(0, 4)} → {g.toDate.slice(0, 4)})</span>
						</li>
					{/each}
				</ul>
			{:else}<p class="text-sm muted">Appears once you've seen a band twice.</p>{/if}

			{#if data.busiestMonths.length && data.busiestMonths[0].concerts > 1}
				<h2 class="h2 mt-5">Busiest months</h2>
				<ul class="space-y-1 text-sm">
					{#each data.busiestMonths as m (m.month)}
						<li>{MONTHS[Number(m.month.slice(5)) - 1]} {m.month.slice(0, 4)} <span class="muted">· {plural(m.concerts, 'concert')}</span></li>
					{/each}
				</ul>
			{/if}
		</section>
		<section class="card">
			{#if data.topEvents.length}
				<h2 class="h2">Festivals</h2>
				<RankList items={data.topEvents.map((e) => ({ href: `/events/${e.id}`, label: e.name, sub: plural(e.years, 'year'), value: e.days, valueLabel: plural(e.days, 'day') }))} />
			{/if}
			<h2 class="h2 {data.topEvents.length ? 'mt-5' : ''}">Best rated bands</h2>
			{#if data.topRated.length}
				<ul class="space-y-1 text-sm">
					{#each data.topRated as b (b.id)}
						<li><a class="link" href="/bands/{b.id}">{b.name}</a> <span class="muted">· ⌀ {b.avgRating.toFixed(1)}★ from {b.rated} shows</span></li>
					{/each}
				</ul>
			{:else}<p class="text-sm muted">Rate concerts to see this.</p>{/if}
			{#if o.avgRating}<p class="mt-3 text-xs muted">Average rating: {o.avgRating.toFixed(2)}★ · ⌀ {o.avgBandsPerConcert} bands per concert</p>{/if}
		</section>
	</div>
{/if}
