<script lang="ts">
	let {
		children,
		loading = $bindable(false),
		onclick,
        classes = ""
	}: {
		children: any;
		loading: boolean;
		onclick?: (event: MouseEvent) => void;
        classes?: string
	} = $props();
</script>

<button aria-label="refresh" class={classes} style:position={"relative"} {onclick}>
    <div class="absolute opacity" class:hidden={!loading}>
        <i class="ti ti-loader-2 spin"></i>
    </div>
	<span class="opacity" class:hidden={loading}>
		{@render children()}
	</span>
</button>

<style>
    .absolute {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .opacity {
        opacity: 1;
        transition: opacity 0.1s ease;
    }
    .opacity.hidden {
        opacity: 0;
    }
</style>