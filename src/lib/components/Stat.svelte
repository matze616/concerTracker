<script lang="ts">
	let { label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string } = $props();
</script>

<svelte:element this={href ? 'a' : 'div'} {href} class="card block {href ? 'hover:border-accent' : ''}">
	<p class="text-sm muted">{label}</p>
	<p class="text-2xl font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString('en-GB') : value}</p>
	{#if sub}<p class="text-xs muted">{sub}</p>{/if}
</svelte:element>
