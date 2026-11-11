<script lang="ts">
	// Ranked list with a thin magnitude bar behind each value.
	let {
		items,
		emptyText = 'Nothing yet.'
	}: {
		items: { href?: string; label: string; sub?: string; value: number; valueLabel?: string }[];
		emptyText?: string;
	} = $props();
	const max = $derived(Math.max(1, ...items.map((i) => i.value)));
</script>

{#if items.length === 0}
	<p class="text-sm muted">{emptyText}</p>
{:else}
	<ol class="space-y-1.5">
		{#each items as it, i (it.label + i)}
			<li class="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 text-sm">
				<span class="text-right tabular-nums muted">{i + 1}</span>
				<div class="min-w-0">
					<div class="truncate">
						{#if it.href}<a class="link text-ink hover:text-accent-ink" href={it.href}>{it.label}</a>{:else}{it.label}{/if}
						{#if it.sub}<span class="muted"> · {it.sub}</span>{/if}
					</div>
					<div class="mt-0.5 h-1 rounded-full bg-surface-2">
						<div class="h-1 rounded-full bg-accent" style="width: {(it.value / max) * 100}%"></div>
					</div>
				</div>
				<span class="tabular-nums text-ink-2">{it.valueLabel ?? it.value}</span>
			</li>
		{/each}
	</ol>
{/if}
