<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Export · Concert Tracker</title></svelte:head>

<h1 class="h1 mb-4">Export &amp; backup</h1>
<div class="grid max-w-4xl gap-4 md:grid-cols-2">
	<section class="card">
		<h2 class="h2">Download</h2>
		<ul class="space-y-3 text-sm">
			<li>
				<a class="btn" href="/export/csv" download>CSV (spreadsheet)</a>
				<p class="mt-1 muted">One row per concert. Opens in LibreOffice Calc or Excel.</p>
			</li>
			<li>
				<a class="btn" href="/export/json" download>JSON (complete)</a>
				<p class="mt-1 muted">All tables, enough to rebuild everything.</p>
			</li>
		</ul>
	</section>
	<section class="card text-sm">
		<h2 class="h2">Your data</h2>
		<p class="mb-1 muted">Database file ({(data.size / 1024).toFixed(0)} KB):</p>
		<p class="mb-3 break-all font-mono text-xs">{data.path}</p>
		<p class="mb-2">The file is ignored by Git and never pushed to GitHub. Make backups with:</p>
		<pre class="rounded-lg bg-surface-2 p-2 text-xs">pnpm backup</pre>
		<p class="mt-2 muted">This writes a copy to <code>backups/</code>. Copy that folder to another drive or a sync folder regularly.</p>
	</section>
</div>
