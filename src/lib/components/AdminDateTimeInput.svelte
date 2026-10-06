<script lang="ts">
	//@ts-ignore
	import { DateTime } from "luxon";

	const DEFAULT_TIMEZONE = "America/Los_Angeles";

	let {
		value = $bindable(null),
		emptyLabel = "",
		showPencil = true,
		timezone = DEFAULT_TIMEZONE,
	}: {
		value?: string | null;
		emptyLabel?: string;
		showPencil?: boolean;
		timezone?: string;
	} = $props();

	let datePicker: HTMLInputElement;

	//Supabase returns a timestamptz (UTC) string. The native picker only
	//understands wall clock time, so move the instant into the display zone.
	function toPickerValue(iso: string | null): string {
		if (!iso) {
			return "";
		}
		let parsed = DateTime.fromISO(iso, { zone: "utc" });
		if (!parsed.isValid) {
			return "";
		}
		return parsed.setZone(timezone).toFormat("yyyy-MM-dd'T'HH:mm");
	}

	//The user picked wall clock time in the display zone, so read it back in
	//that zone and emit a full ISO string that is safe to store in timestamptz.
	function fromPickerValue(pickerValue: string): string | null {
		if (!pickerValue) {
			return null;
		}
		let parsed = DateTime.fromISO(pickerValue, { zone: timezone });
		if (!parsed.isValid) {
			return null;
		}
		return parsed.toUTC().toISO();
	}

	let pickerValue = $derived(toPickerValue(value));

	let emptyText = $derived(
		emptyLabel
	);

	let displayText = $derived(
		!pickerValue
			? emptyText
			: DateTime.fromISO(pickerValue, { zone: timezone }).toFormat(
					"LLLL d, yyyy, h:mm a ZZZZ"
				)
	);
</script>

<div
	role="presentation"
	class="admin-editor-metadata-date"
	onclick={() => {
		datePicker.showPicker();
	}}
>
	{displayText}
	{#if showPencil}
		<i class="ti ti-pencil"></i>
	{/if}
	<input
		bind:this={datePicker}
		type="datetime-local"
		value={pickerValue}
		oninput={(e) => {
			value = fromPickerValue(e.currentTarget.value);
		}}
	/>
</div>