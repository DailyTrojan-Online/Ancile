<script lang="ts">
    import { onMount } from "svelte";
    import MediaLibraryInput from "$lib/components/MediaLibraryInput.svelte";
    import AsyncActionButton from "$lib/components/AsyncActionButton.svelte";
    let { data } = $props();
    let { supabase } = $derived(data);
    
    let unsavedData = $state(false);

    import { beforeNavigate } from "$app/navigation";
    import { browser } from "$app/environment";
    if (browser) {
        beforeNavigate(({ cancel, type }) => {
            if (unsavedData) {
                if (type === "link" || type === "goto" || type === "popstate") {
                    if (
                        !confirm(
                            "You have unsaved changes. Are you sure you want to leave?",
                        )
                    ) {
                        cancel();
                    }
                }
                else if (type === "leave") {
                    cancel();
                }
            }
        });

        window.addEventListener("beforeunload", (event) => {
            if (unsavedData) {
                event.preventDefault();
                event.returnValue = "";
                return "You have unsaved changes that will be lost.";
            }
        });
    }

    async function refreshColumns() {
        columns = null;
        let { data, error } = await supabase
            .from("app_columns")
            .select("id,tag_id,title,byline,description,image,section");
        if (error) {
            console.error(error);
        }
        columns = [...data];
        originalColumns = [...data];
    }

    async function saveColumns() {
        let { data: delData, error: delError } = await supabase
            .from("app_columns")
            .delete()
            .not("id", "is", null);
        if (delError) {
            console.error(delError);
        }

        console.log(columns);
        let { data: insData, error: insError } = await supabase
            .from("app_columns")
            .upsert(columns);
        if (insError) {
            console.error(insError);
        }
        console.log("Columns saved:", columns);
        isModified = false;
    }
    onMount(() => {
        refreshColumns();
    });

    type Column = {
        id: number;
        title: string;
        tag_id: number;
        image?: string;
        byline?: string;
        description?: string;
        section: string;
    };

    let columns: Column[] | null = $state(null);

    let originalColumns: Column[] | null = $state(null);

    let isModified = $derived(
        JSON.stringify(columns) !== JSON.stringify(originalColumns),
    );
    $effect(() => {
        unsavedData = isModified;
    });

    function addColumn() {
        if (columns === null) {
            columns = [];
        }
        const newId =
            columns.length > 0 ? Math.max(...columns.map((c) => c.id)) + 1 : 1;
        const newColumn: Column = {
            id: newId,
            title: "New Column",
            tag_id: newId,
            image: "",
            byline: "",
            description: "",
            section: "",
        };
        columns.push(newColumn);
        selectedIndex = columns.length - 1;
    }

    let selectedIndex: number | null = $state(null);

    async function deleteColumn(column: Column) {
        if (columns == null) return;
        selectedIndex = null;
        columns = columns.filter((c) => c.id !== column.id);
        let { data: delData, error: delError } = await supabase
            .from("app_columns")
            .delete()
            .eq("id", column.id);
        if (delError) {
            console.error(delError);
        }
    }
</script>

<div
    class="admin-editor-column admin-editor-sidebar-inner admin-editor-column-noborder"
>
    <h2 class="h2-with-buttons">
        Columns
        <div class="button-group">
            {#if isModified}
                <AsyncActionButton action={saveColumns}>Save</AsyncActionButton>
            {/if}
            <button
                class="admin-button button-icon"
                onclick={addColumn}
                title="Add Column"
            >
                <i class="ti ti-plus"></i>
            </button>
        </div>
    </h2>

    <div class="list">
        {#if columns === null}
            <div class="admin-grid-loader">
                <i class="ti ti-loader-2"></i>
            </div>
        {:else if columns.length == 0}
        <p>There are no columns yet. Click [+] to add one.</p>
        {:else}
            {#each columns as column, i}
                <button
                    class="column-item"
                    class:active={i === selectedIndex}
                    onclick={() => {
                        selectedIndex = i;
                    }}
                >
                    {#if column.image}
                        <img src={column.image} alt="" />
                    {/if}
                    <div class="flex-stack">
                        <h3 class="title">{column.title}</h3>
                        {#if column.byline}
                            <h3 class="byline">{column.byline}</h3>
                        {/if}
                    </div>
                    <div class="column-id">
                        {column.tag_id}
                    </div>
                </button>
            {/each}
        {/if}
    </div>
</div>

<!-- Properties Panel -->
<div
    class="admin-editor-column admin-editor-fullwidth admin-editor-sidebar-inner"
    style:gap="20px !important"
>
    <h2 class="h2-with-buttons">
        Edit Column
        {#if selectedIndex !== null && columns !== null}
            <div class="button-group">
                <AsyncActionButton
                    action={() => deleteColumn(columns![selectedIndex!])}
                >
                    Delete
                </AsyncActionButton>
            </div>
        {/if}
    </h2>

    {#if selectedIndex !== null && columns !== null}
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">TAG ID</div>
            <input
                type="number"
                class="admin-editor-input"
                bind:value={columns[selectedIndex].tag_id}
                placeholder="Column ID"
            />
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Title</div>
            <input
                type="text"
                class="admin-editor-input"
                bind:value={columns[selectedIndex].title}
                placeholder="Column title"
            />
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Byline</div>
            <input
                type="text"
                class="admin-editor-input"
                bind:value={columns[selectedIndex].byline}
                placeholder="Column byline"
            />
        </div>

        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Section</div>
            <select
                class="admin-editor-input-dropdown"
                bind:value={columns[selectedIndex].section}
            >
                <option value="" selected disabled hidden
                    >Select an option</option
                >
                <option value={"arts_entertainment"}
                    >Arts & Entertainment</option
                >
                <option value={"sports"}>Sports</option>
                <option value={"opinion"}>Opinion</option>
            </select>
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Description</div>
            <textarea
                class="admin-editor-metadata-textarea"
                bind:value={columns[selectedIndex].description}
                placeholder="Column description"
            ></textarea>
        </div>
        <MediaLibraryInput
            bind:image={columns[selectedIndex].image}
            {supabase}
            title="Column Image"
        />
    {:else}
        <p>Select a column to edit its properties</p>
    {/if}
</div>

<style>
    .admin-editor-column {
        gap: 0px;
    }
    .header-with-buttons {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    .header-with-buttons h2 {
        margin: 0;
    }
    .button-group {
        display: flex;
        gap: 8px;
    }
    .column-id {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 0.75rem;
        opacity: 0.6;
        font-family: monospace;
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 4px 8px;
    }
    .column-item {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-top: 8px;
        padding: 8px;
        box-sizing: border-box;
        width: 100%;
        background: transparent;
        transition: 0.1s;
        cursor: pointer;
        position: relative;
    }
    .column-item:hover {
        border: 1px solid var(--accent);
        outline: 1px solid var(--accent);
    }
    .column-item.active {
        outline: 3px solid var(--accent);
    }
    .column-item h3 {
        font-weight: normal;
        text-align: left;
    }
    .column-item img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 100px;
        filter: grayscale(1);
    }
    .flex-stack {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .column-item .title {
        font-weight: bold;
    }
    .flex-stack * {
        margin: 0;
    }
</style>
