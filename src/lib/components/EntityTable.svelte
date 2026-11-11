<script lang="ts">
	// Searchable, sortable table for the index pages.
	import type { Snippet } from 'svelte';

	interface Col<T> {
		key: keyof T & string;
		label: string;
		num?: boolean;
		format?: (row: T) => string;
	}
	let {
		rows,
		columns,
		href,
		searchKeys,
		initialSort,
		empty
	}: {
		rows: any[];
		columns: Col<any>[];
		href: (row: any) => string;
		searchKeys: string[];
		initialSort: string;
		empty?: Snippet;
	} = $props();

	let q = $state('');
	// svelte-ignore state_referenced_locally
	let sortKey = $state(initialSort);
	let desc = $state(true);

	const shown = $derived(
		rows
			.filter((r) => !q || searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase())))
			.sort((a, b) => {
				const x = a[sortKey] ?? '';
				const y = b[sortKey] ?? '';
				const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { sensitivity: 'base' });
				return desc ? -cmp : cmp;
			})
	);

	function sortBy(k: string) {
		if (sortKey === k) desc = !desc;
		else {
			sortKey = k;
			desc = columns.find((c) => c.key === k)?.num ?? false;
		}
	}
</script>

{#if rows.length === 0}
	{#if empty}{@render empty()}{:else}<p class="muted">Nothing here yet.</p>{/if}
{:else}
	<input class="input mb-3 max-w-xs" type="search" placeholder="Filter…" bind:value={q} />
	<div class="card overflow-x-auto py-1">
		<table class="table">
			<thead>
				<tr>
					{#each columns as c (c.key)}
						<th class={c.num ? 'num' : ''}>
							<button class="cursor-pointer hover:text-ink" onclick={() => sortBy(c.key)}>
								{c.label}{sortKey === c.key ? (desc ? ' ↓' : ' ↑') : ''}
							</button>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each shown as r (r.id)}
					<tr class="hover:bg-surface-2">
						{#each columns as c, i (c.key)}
							<td class={c.num ? 'num' : ''}>
								{#if i === 0}<a class="link font-medium text-ink" href={href(r)}>{c.format ? c.format(r) : r[c.key]}</a>
								{:else}{c.format ? c.format(r) : (r[c.key] ?? '–')}{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-2 text-sm muted">{shown.length} of {rows.length}</p>
{/if}
