<script lang="ts">
    import SectionManager from "$lib/components/AppSettings/SectionManager.svelte";
    import ColumnManager from "$lib/components/AppSettings/ColumnManager.svelte";
    import { Toaster, toast } from "svelte-sonner";

    let { data } = $props();
    let { supabase } = $derived(data);

    let page = $state("sections");

    let columnsUnsaved = $state(false);
    let sectionsUnsaved = $state(false);
    $inspect(columnsUnsaved);
    function setPage(newPage: string) {
        if (columnsUnsaved || sectionsUnsaved) {
          toast.error("You have unsaved changes. Please save or discard them before switching pages.", {
            action: {
              label: "Discard",
              onClick:()=>{
              page = newPage;
              columnsUnsaved = false;
              sectionsUnsaved = false;
            }}
          });
            return;
        }
        page = newPage;
    }
</script>

<div class="admin-page-content">
    <div class="admin-page-header">
        <div class="admin-buttons">
            <h1>App Settings</h1>
        </div>
    </div>

    <div class="admin-editor">
        <Toaster position="top-right" offset="10px" richColors></Toaster>
        <div class="admin-editor-page-switcher">
            <button
                class="admin-editor-page-switcher-button"
                class:active={page === "sections"}
                onclick={() => setPage("sections")}>Sections</button
            >
            <button
                class="admin-editor-page-switcher-button"
                class:active={page === "columns"}
                onclick={() => setPage("columns")}>Columns</button
            >
        </div>
        <div class="admin-editor">
            {#if page === "sections"}
                <SectionManager {supabase} bind:unsavedData={sectionsUnsaved}
                ></SectionManager>
            {:else if page === "columns"}
                <ColumnManager {supabase} bind:unsavedData={columnsUnsaved}
                ></ColumnManager>
            {/if}
        </div>
    </div>
</div>

<style>
    .admin-editor-page-switcher {
        width: 250px;
        border-right: 1px solid var(--border);
    }
    .admin-editor-page-switcher-button {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border);
        padding: 8px 12px;
        box-sizing: border-box;
        text-align: left;
        cursor: pointer;
    }
    .admin-editor-page-switcher-button:hover {
        background: #f8f8f9;
    }
    .admin-editor-page-switcher-button.active {
        background: var(--accent);
        color: white;
    }
</style>
