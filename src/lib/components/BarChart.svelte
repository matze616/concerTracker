<script lang="ts">
	// Single-series column chart (Chart.js). Theme-aware, hover tooltip, table view for accessibility.
	import { onMount } from 'svelte';
	import type { Chart as ChartType } from 'chart.js';

	let {
		labels,
		values,
		label,
		format = (v: number) => v.toLocaleString('en-GB'),
		height = 220,
		onselect
	}: {
		labels: string[];
		values: number[];
		label: string;
		format?: (v: number) => string;
		height?: number;
		onselect?: (index: number) => void;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: ChartType | undefined;
	let showTable = $state(false);

	function colors() {
		const cs = getComputedStyle(document.documentElement);
		const v = (n: string) => cs.getPropertyValue(n).trim();
		return { bar: v('--series-1'), grid: v('--grid'), text: v('--text-muted'), surface: v('--surface-1'), ink: v('--text-primary') };
	}

	function build(Chart: typeof ChartType) {
		const c = colors();
		chart?.destroy();
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label,
						data: values,
						backgroundColor: c.bar,
						hoverBackgroundColor: c.bar,
						borderRadius: { topLeft: 4, topRight: 4 },
						borderSkipped: 'start',
						maxBarThickness: 24,
						categoryPercentage: 0.8,
						barPercentage: 0.9
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				interaction: { mode: 'index', intersect: false },
				onClick: (_e, els) => {
					if (onselect && els[0]) onselect(els[0].index);
				},
				onHover: (e, els) => {
					if (onselect) (e.native?.target as HTMLElement).style.cursor = els.length ? 'pointer' : 'default';
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: c.surface,
						titleColor: c.ink,
						bodyColor: c.ink,
						borderColor: c.grid,
						borderWidth: 1,
						displayColors: false,
						callbacks: { label: (ctx) => `${label}: ${format(ctx.parsed.y ?? 0)}` }
					}
				},
				scales: {
					x: { grid: { display: false }, ticks: { color: c.text, maxRotation: 0, autoSkip: true }, border: { color: c.grid } },
					y: {
						beginAtZero: true,
						grid: { color: c.grid },
						border: { display: false },
						ticks: { color: c.text, precision: 0, callback: (v) => format(Number(v)) }
					}
				}
			}
		});
	}

	onMount(() => {
		let Chart: typeof ChartType;
		const media = matchMedia('(prefers-color-scheme: dark)');
		const rebuild = () => Chart && build(Chart);
		import('chart.js/auto').then((m) => {
			Chart = m.default;
			build(Chart);
		});
		media.addEventListener('change', rebuild);
		return () => {
			media.removeEventListener('change', rebuild);
			chart?.destroy();
		};
	});

	$effect(() => {
		// update when data changes
		if (chart) {
			chart.data.labels = labels;
			chart.data.datasets[0].data = values;
			chart.update();
		}
	});
</script>

<div style="height: {height}px" class={showTable ? 'hidden' : ''}>
	<canvas bind:this={canvas} aria-label="{label} chart"></canvas>
</div>
{#if showTable}
	<div class="max-h-72 overflow-auto">
		<table class="table">
			<thead><tr><th></th><th class="num">{label}</th></tr></thead>
			<tbody>
				{#each labels as l, i (l)}<tr><td>{l}</td><td class="num">{format(values[i])}</td></tr>{/each}
			</tbody>
		</table>
	</div>
{/if}
<button type="button" class="mt-1 text-xs link" onclick={() => (showTable = !showTable)}>{showTable ? 'Show chart' : 'Show as table'}</button>
