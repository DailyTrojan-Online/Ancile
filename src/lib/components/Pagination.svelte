<script lang="ts">
    let { page = $bindable(1), pageCount = 1, onChange = (x)=>{} }: {page: number,pageCount: number, onChange: (page: number) => void} = $props();
    function validatePage() {
        if (page < 1) {
            page = 1;
        } else if (page > pageCount) {
            page = pageCount;
        }
    }

    function pageUpdate() {
        validatePage();
        onChange(page);
    }
    let timeout: any;
    function debouncedPageUpdate() {
      clearTimeout(timeout);
      timeout = setTimeout(()=>{pageUpdate()}, 500);
    }
</script>

<button disabled={page == 1} aria-label="left" class="admin-button button-icon button-sub" onclick={() => {page = 1; pageUpdate();}}>
    <i class="ti ti-chevrons-left"></i>
</button>
<button disabled={page == 1} aria-label="left" class="admin-button button-icon button-sub" onclick={() => {page--; pageUpdate();}}>
    <i class="ti ti-chevron-left"></i>
</button>
<div class="flex-hor">
    <input type="number" bind:value={page} oninput={debouncedPageUpdate} min="1" max={Math.max(pageCount, 1)}>
    <p>of {Math.max(pageCount, 1)}</p>
</div>
<button disabled={page == pageCount} aria-label="right" class="admin-button  button-icon button-sub" onclick={() =>{ page++;pageUpdate();}}>
    <i class="ti ti-chevron-right"></i>
</button>
<button disabled={page == pageCount} aria-label="right" class="admin-button  button-icon button-sub" onclick={() =>{ page = pageCount;pageUpdate();}}>
    <i class="ti ti-chevrons-right"></i>
</button>

<style>
    p {
        font-family: "Geist Mono";
    }
    input[type="number"] {
        padding: 0;
        height: fit-content;
        border: 1px solid var(--border);
        padding: 8px;
        border-radius: 8px;
    }
    .flex-hor {
        align-items: center;
    }
</style>