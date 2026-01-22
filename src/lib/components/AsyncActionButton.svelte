<script lang="ts">
    let { action, children }: { action: () => Promise<void>, children: any } = $props();
    let loading = $state(false);

    async function refreshButton() {
        loading = true;
        action().then(() => {
            loading = false;
        }); 
    }
</script>

<button aria-label="refresh" class="admin-button button-primary" onclick={refreshButton}>
    <i class="ti ti-loader-2 spin-center" class:hidden={!loading}></i>
    <span class:hidden={loading}>{@render children()}</span>
</button>

<style>
    .spin-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    button {
        position: relative;
    }
    button * {
        transition: 0.2s opacity
    }
    .hidden {
        opacity: 0;
    }
</style>