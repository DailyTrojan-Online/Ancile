<script lang="ts">
	let {
		id = $bindable(""),
		classes = $bindable(""),
	}: { id: string; classes: string } = $props();
</script>

<div class="admin-editor-sidebar-section">
	<h2>Developer Settings</h2>

	<div class="admin-editor-input-group">
		<div class="admin-editor-input-label">HTML ID</div>
		<input type="text" class="admin-editor-input" bind:value={id} />
		<p class="admin-editor-input-description">
			A unique ID for this block for CSS or JS use, or for linking with an
			anchor.
		</p>
	</div>
	<div class="admin-editor-input-group">
		<p class="admin-editor-input-label">CSS Classes</p>
		<input type="text" class="admin-editor-input" bind:value={classes} />
		<p class="admin-editor-input-description">
			CSS Classes for this block, separated by spaces.
		</p>
	</div>
</div>
