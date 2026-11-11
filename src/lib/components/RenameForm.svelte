<script lang="ts">
	import { enhance } from '$app/forms';
	let { name, what, error }: { name: string; what: string; error?: string } = $props();
	let open = $state(false);
</script>

{#if open}
	<form method="POST" action="?/rename" class="flex flex-wrap items-center gap-2" use:enhance>
		<input class="input w-64" name="name" value={name} required />
		<button class="btn btn-primary">Save</button>
		<button type="button" class="btn" onclick={() => (open = false)}>Cancel</button>
		<p class="w-full text-xs muted">If another {what} already has this name, both are merged.</p>
		{#if error}<p class="w-full text-sm text-danger">{error}</p>{/if}
	</form>
{:else}
	<button class="btn" onclick={() => (open = true)}>Rename / merge</button>
{/if}
