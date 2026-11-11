<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const nav = [
		{ href: '/', label: 'Overview' },
		{ href: '/concerts', label: 'Concerts' },
		{ href: '/bands', label: 'Bands' },
		{ href: '/venues', label: 'Venues' },
		{ href: '/people', label: 'People' },
		{ href: '/events', label: 'Tours & festivals' },
		{ href: '/export', label: 'Export' }
	];
	const active = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Concert Tracker</title>
</svelte:head>

<header class="border-b border-line bg-surface-1">
	<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
		<a href="/" class="font-semibold tracking-tight">🎸 Concert Tracker</a>
		<nav class="flex flex-wrap gap-1 text-sm">
			{#each nav as n (n.href)}
				<a
					href={n.href}
					class="rounded-md px-2.5 py-1 {active(n.href) ? 'bg-surface-2 font-medium text-ink' : 'text-ink-2 hover:text-ink'}"
					aria-current={active(n.href) ? 'page' : undefined}>{n.label}</a
				>
			{/each}
		</nav>
		<a href="/concerts/new" class="btn btn-primary ml-auto">+ Add concert</a>
	</div>
	{#if data.demo}
		<p class="bg-amber-500/15 px-4 py-1 text-center text-xs">Demo database ({data.dbFile}) – fictional data</p>
	{/if}
</header>

<main class="mx-auto max-w-6xl px-4 py-6">
	{@render children()}
</main>
