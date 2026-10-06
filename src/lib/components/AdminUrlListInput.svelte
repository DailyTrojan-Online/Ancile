<script lang="ts">
	let {
		items = $bindable([]),
		title = "Article URLs",
		placeholder = "https://",
	}: {
		items?: { article_url: string }[];
		title?: string;
		placeholder?: string;
	} = $props();

	const ROW_HEIGHT = 40;
	const GAP = 8;

	let listEl: HTMLDivElement | null = $state(null);
	let dragIndex = $state<number | null>(null);
	let dropIndex = $state<number | null>(null);

	let list = $derived(items ?? []);
	let isDragging = $derived(dragIndex !== null);

	function addItem() {
		items = [...list, { article_url: "" }];
	}

	function removeItem(index: number) {
		items = list.filter((_, i) => i !== index);
		resetDrag();
	}

	function handleDragStart(e: DragEvent, index: number) {
		dragIndex = index;
		dropIndex = index;
		if (!e.dataTransfer) {
			return;
		}
		e.dataTransfer.effectAllowed = "move";
		let row = (e.currentTarget as HTMLElement).closest(
			".admin-url-list-row"
		) as HTMLElement | null;
		if (row) {
			e.dataTransfer.setDragImage(row, 24, ROW_HEIGHT / 2);
		}
	}

	function handleDragOver(e: DragEvent) {
		if (!isDragging) {
			return;
		}
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = "move";
		}
		dropIndex = computeDropIndex(e.clientY);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (dragIndex !== null && dropIndex !== null) {
			let insertAt = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
			if (insertAt !== dragIndex) {
				let next = [...list];
				let [moved] = next.splice(dragIndex, 1);
				next.splice(insertAt, 0, moved);
				items = next;
			}
		}
		resetDrag();
	}

	function resetDrag() {
		dragIndex = null;
		dropIndex = null;
	}

	//Rows are a fixed height with a fixed gap, so the insertion point can be
	//derived from the pointer position without tracking individual rows.
	function computeDropIndex(clientY: number): number {
		if (listEl == null) {
			return 0;
		}
		let rect = listEl.getBoundingClientRect();
		let y = clientY - rect.top + listEl.scrollTop;
		let raw = Math.floor((y + GAP) / (ROW_HEIGHT + GAP));
		return Math.max(0, Math.min(raw, list.length));
	}

	function dropPointY(): number {
		if (dropIndex == null || dropIndex === 0) {
			return 0;
		}
		if (dropIndex >= list.length) {
			return list.length * (ROW_HEIGHT + GAP);
		}
		return dropIndex * (ROW_HEIGHT + GAP) + ROW_HEIGHT;
	}
</script>

<div class="admin-editor-input-group">
	<div class="admin-editor-input-label">{title}</div>
	<div
		class="admin-url-list"
		role="list"
		aria-label={title}
		bind:this={listEl}
		ondragover={handleDragOver}
		ondrop={handleDrop}
	>
		<div
			class="admin-url-list-dropper"
			class:active={isDragging}
			style:top={dropPointY() + "px"}
		></div>
		{#if list.length == 0}
			<div class="admin-url-list-empty">No articles yet.</div>
		{/if}
		{#each list as item, i}
			<div
				class="admin-url-list-row"
				role="listitem"
				class:dragging={dragIndex === i}
			>
				<button
					type="button"
					class="admin-url-list-handle"
					draggable="true"
					title="Drag to reorder"
					aria-label="Reorder article"
					ondragstart={(e) => handleDragStart(e, i)}
					ondragend={resetDrag}
				>
					<i class="ti ti-grip-vertical"></i>
				</button>
				<input
					type="text"
					class="admin-editor-input"
					bind:value={item.article_url}
					{placeholder}
				/>
				<button
					type="button"
					class="admin-button button-icon"
					title="Remove article"
					aria-label="Remove article"
					onclick={() => removeItem(i)}
				>
					<i class="ti ti-x"></i>
				</button>
			</div>
		{/each}
	</div>
	<button class="admin-button button-sub" onclick={addItem}>
		<i class="ti ti-plus"></i>Add Article
	</button>
</div>

<style>
	.admin-url-list {
		position: relative;
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 8px;
		min-height: 68px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.admin-url-list-dropper {
		height: 4px;
		background: var(--accent);
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		border-radius: 5px;
		z-index: 999;
		opacity: 0;
		transition:
			opacity 0.1s,
			top 0.15s ease-out;
	}
	.admin-url-list-dropper.active {
		opacity: 1;
	}
	.admin-url-list-empty {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
		pointer-events: none;
	}
	.admin-url-list-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 40px;
		box-sizing: border-box;
	}
	.admin-url-list-row.dragging {
		opacity: 0.4;
	}
	.admin-url-list-handle {
		flex-shrink: 0;
		width: 24px;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		opacity: 0.5;
		font-size: 18px;
		cursor: grab;
	}
	.admin-url-list-handle:hover {
		opacity: 1;
	}
	.admin-url-list-handle:active {
		cursor: grabbing;
	}
	.admin-url-list-row .admin-editor-input {
		flex: 1;
		min-width: 0;
	}
	.admin-url-list-row .button-icon {
		flex-shrink: 0;
	}
</style>