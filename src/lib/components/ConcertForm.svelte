<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { ConcertFormState, FormErrors, FormOptions } from '#lib/types.ts';
	import { venueLabel } from '#lib/format.ts';

	let {
		initial,
		options,
		errors = {},
		submitLabel = 'Save concert'
	}: {
		initial: ConcertFormState;
		options: FormOptions;
		errors?: FormErrors;
		submitLabel?: string;
	} = $props();

	// Form state is seeded once from `initial`; afterwards the user owns it.
	// svelte-ignore state_referenced_locally
	let s = $state<ConcertFormState>(structuredClone(initial));
	let submitting = $state(false);

	// ----- Venue -----------------------------------------------------------
	const venueByLabel = $derived(new Map(options.venues.map((v) => [venueLabel(v).toLowerCase(), v])));
	// svelte-ignore state_referenced_locally
	let venueText = $state(
		initial.venueId
			? venueLabel(options.venues.find((v) => v.id === initial.venueId) ?? { name: initial.venueName, city: initial.venueCity })
			: initial.venueName
	);
	const matchedVenue = $derived(
		venueByLabel.get(venueText.trim().toLowerCase()) ??
			// a bare name matches when exactly one venue has it
			(() => {
				const hits = options.venues.filter((v) => v.name.toLowerCase() === venueText.trim().toLowerCase());
				return hits.length === 1 ? hits[0] : undefined;
			})()
	);
	$effect(() => {
		// a different venue was chosen → leave address-edit mode
		if ((matchedVenue?.id ?? null) !== s.venueId) s.venueEdit = false;
		if (matchedVenue) {
			s.venueId = matchedVenue.id;
			s.venueName = matchedVenue.name;
		} else {
			s.venueId = null;
			s.venueName = venueText.replace(/\s+—\s+.*$/, '').trim();
		}
	});

	// ----- Bands -----------------------------------------------------------
	let bandInputs: HTMLInputElement[] = $state([]);
	if (s.bands.length === 0) s.bands.push({ name: '', headliner: false });

	async function addBand(after = s.bands.length - 1) {
		s.bands.splice(after + 1, 0, { name: '', headliner: false });
		await tick();
		bandInputs[after + 1]?.focus();
	}
	function removeBand(i: number) {
		s.bands.splice(i, 1);
		if (s.bands.length === 0) s.bands.push({ name: '', headliner: false });
	}
	function move(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= s.bands.length) return;
		[s.bands[i], s.bands[j]] = [s.bands[j], s.bands[i]];
	}
	function bandKey(e: KeyboardEvent, i: number) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (s.bands[i].name.trim()) addBand(i);
		} else if (e.key === 'Backspace' && s.bands[i].name === '' && s.bands.length > 1) {
			e.preventDefault();
			removeBand(i);
			bandInputs[Math.max(0, i - 1)]?.focus();
		}
	}

	// Drag & drop reordering
	let dragIndex = $state<number | null>(null);
	function drop(i: number) {
		if (dragIndex === null || dragIndex === i) return;
		const [b] = s.bands.splice(dragIndex, 1);
		s.bands.splice(i, 0, b);
		dragIndex = null;
	}

	// ----- People ----------------------------------------------------------
	let personText = $state('');
	function addPerson() {
		const name = personText.replace(/,/g, '').trim();
		if (!name) return;
		const existing = options.people.find((p) => p.toLowerCase() === name.toLowerCase()) ?? name;
		if (!s.people.some((p) => p.toLowerCase() === existing.toLowerCase())) s.people.push(existing);
		personText = '';
	}
	function personKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addPerson();
		} else if (e.key === 'Backspace' && personText === '' && s.people.length) {
			s.people.pop();
		}
	}
	function onPersonInput() {
		// picking an entry from the datalist fills the whole name → add it right away
		if (options.people.some((p) => p === personText)) addPerson();
	}

	const payload = $derived(JSON.stringify(s));
</script>

<form
	method="POST"
	class="space-y-6"
	use:enhance={() => {
		addPerson();
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
	onsubmit={() => addPerson()}
>
	<input type="hidden" name="payload" value={payload} />

	{#if errors.form}<p class="rounded-lg bg-danger/10 p-3 text-danger">{errors.form}</p>{/if}

	<div class="grid gap-4 sm:grid-cols-[12rem_1fr]">
		<div>
			<label class="label" for="date">Date</label>
			<input id="date" type="date" class="input" bind:value={s.date} required min="1950-01-01" />
			{#if errors.date}<p class="mt-1 text-sm text-danger">{errors.date}</p>{/if}
		</div>
		<div>
			<label class="label" for="venue">Venue</label>
			<input
				id="venue"
				class="input"
				list="venue-list"
				autocomplete="off"
				placeholder="Start typing a venue…"
				bind:value={venueText}
			/>
			<datalist id="venue-list">
				{#each options.venues as v (v.id)}<option value={venueLabel(v)}></option>{/each}
			</datalist>
			{#if errors.venue}<p class="mt-1 text-sm text-danger">{errors.venue}</p>{/if}
			{#if matchedVenue && !s.venueEdit}
				<p class="mt-1 text-sm muted">
					{[matchedVenue.address, matchedVenue.city, matchedVenue.country].filter(Boolean).join(', ') || 'Existing venue'}
					·
					<button
						type="button"
						class="link"
						onclick={() => {
							s.venueAddress = matchedVenue.address ?? '';
							s.venueCity = matchedVenue.city ?? '';
							s.venueCountry = matchedVenue.country ?? '';
							s.venueEdit = true;
						}}>Edit address</button
					>
				</p>
			{/if}
		</div>
	</div>

	{#if (!matchedVenue && venueText.trim()) || (matchedVenue && s.venueEdit)}
		<fieldset class="card space-y-3 border-dashed">
			<legend class="px-1 text-sm font-medium">
				{#if matchedVenue}
					Address of {matchedVenue.name}
					<span class="font-normal muted">(applies to all concerts there) ·</span>
					<button type="button" class="link font-normal" onclick={() => (s.venueEdit = false)}>Cancel</button>
				{:else}
					New venue: {s.venueName}
				{/if}
			</legend>
			<div>
				<label class="label" for="addr">Address</label>
				<input id="addr" class="input" bind:value={s.venueAddress} placeholder="Street and number (optional)" />
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<label class="label" for="city">City</label>
					<input id="city" class="input" bind:value={s.venueCity} />
				</div>
				<div>
					<label class="label" for="country">Country</label>
					<input id="country" class="input" bind:value={s.venueCountry} list="country-list" />
					<datalist id="country-list">
						{#each [...new Set(options.venues.map((v) => v.country).filter(Boolean))] as c (c)}<option value={c}></option>{/each}
					</datalist>
				</div>
			</div>
			<p class="text-xs muted">The location is looked up on OpenStreetMap when you save.</p>
		</fieldset>
	{/if}

	<div>
		<label class="label" for="event">Festival / event <span class="font-normal muted">(optional)</span></label>
		<input id="event" class="input" list="event-list" autocomplete="off" bind:value={s.event} placeholder="e.g. a festival or tour name" />
		<datalist id="event-list">
			{#each options.events as e (e)}<option value={e}></option>{/each}
		</datalist>
	</div>

	<fieldset>
		<legend class="label">Bands <span class="font-normal muted">— in running order, first on stage at the top. Enter adds the next band.</span></legend>
		<datalist id="band-list">
			{#each options.bands as b (b)}<option value={b}></option>{/each}
		</datalist>
		<ol class="space-y-2">
			{#each s.bands as band, i (band)}
				<li
					class="flex items-center gap-2 rounded-lg {dragIndex === i ? 'opacity-50' : ''}"
					draggable="true"
					ondragstart={() => (dragIndex = i)}
					ondragover={(e) => e.preventDefault()}
					ondrop={() => drop(i)}
					ondragend={() => (dragIndex = null)}
				>
					<span class="w-6 cursor-grab text-center text-ink-3 select-none" title="Drag to reorder">⠿</span>
					<input
						class="input"
						list="band-list"
						autocomplete="off"
						placeholder={i === 0 ? 'Band name' : 'Next band'}
						aria-label="Band {i + 1}"
						bind:value={band.name}
						bind:this={bandInputs[i]}
						onkeydown={(e) => bandKey(e, i)}
					/>
					<label class="flex shrink-0 items-center gap-1 text-sm text-ink-2" title="Headliner">
						<input type="checkbox" bind:checked={band.headliner} /> Headliner
					</label>
					<button type="button" class="btn px-2" aria-label="Move up" onclick={() => move(i, -1)} disabled={i === 0}>↑</button>
					<button type="button" class="btn px-2" aria-label="Move down" onclick={() => move(i, 1)} disabled={i === s.bands.length - 1}>↓</button>
					<button type="button" class="btn px-2" aria-label="Remove band" onclick={() => removeBand(i)}>✕</button>
				</li>
			{/each}
		</ol>
		<button type="button" class="btn mt-2" onclick={() => addBand()}>+ Add band</button>
		{#if errors.bands}<p class="mt-1 text-sm text-danger">{errors.bands}</p>{/if}
	</fieldset>

	<div>
		<label class="label" for="person">People you went with</label>
		<div class="input flex flex-wrap items-center gap-1.5 py-1">
			{#each s.people as p, i (p)}
				<span class="chip">
					{p}
					<button type="button" class="text-ink-3 hover:text-danger" aria-label="Remove {p}" onclick={() => s.people.splice(i, 1)}>✕</button>
				</span>
			{/each}
			<input
				id="person"
				class="min-w-32 flex-1 bg-transparent py-0.5 outline-none"
				list="people-list"
				autocomplete="off"
				placeholder={s.people.length ? '' : 'Type a name, press Enter (empty = went alone)'}
				bind:value={personText}
				onkeydown={personKey}
				oninput={onPersonInput}
				onblur={addPerson}
			/>
		</div>
		<datalist id="people-list">
			{#each options.people.filter((p) => !s.people.includes(p)) as p (p)}<option value={p}></option>{/each}
		</datalist>
	</div>

	<div class="grid gap-4 sm:grid-cols-[1fr_6rem_1fr]">
		<div>
			<label class="label" for="price">Ticket price</label>
			<input id="price" class="input" inputmode="decimal" bind:value={s.price} placeholder="e.g. 35,50" />
			{#if errors.price}<p class="mt-1 text-sm text-danger">{errors.price}</p>{/if}
		</div>
		<div>
			<label class="label" for="currency">Currency</label>
			<input id="currency" class="input uppercase" maxlength="3" bind:value={s.currency} />
		</div>
		<div>
			<span class="label">Rating</span>
			<div class="flex items-center gap-1 py-1" role="radiogroup" aria-label="Rating">
				{#each [1, 2, 3, 4, 5] as n (n)}
					<button
						type="button"
						role="radio"
						aria-checked={s.rating === n}
						aria-label="{n} star{n > 1 ? 's' : ''}"
						class="text-2xl leading-none {s.rating && n <= s.rating ? 'text-amber-500' : 'text-ink-3'}"
						onclick={() => (s.rating = s.rating === n ? null : n)}>★</button
					>
				{/each}
				{#if s.rating}<button type="button" class="ml-2 text-sm link" onclick={() => (s.rating = null)}>clear</button>{/if}
			</div>
		</div>
	</div>

	<div>
		<label class="label" for="notes">Notes</label>
		<textarea id="notes" class="input min-h-24" bind:value={s.notes} placeholder="Memories, setlist highlights, weather…"></textarea>
	</div>

	<div class="flex gap-2">
		<button class="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
		<a class="btn" href="/concerts">Cancel</a>
	</div>
</form>
