<script lang="ts">
    import { onMount } from "svelte";
    import MediaLibraryInput from "$lib/components/MediaLibraryInput.svelte";
    import AsyncActionButton from "$lib/components/AsyncActionButton.svelte";
    let { data } = $props();
    let { supabase } = $derived(data);

    let unsavedData = $state(false);

    import { beforeNavigate } from "$app/navigation";
    import { browser } from "$app/environment";
    import AdminDateTimeInput from "$lib/components/AdminDateTimeInput.svelte";
    import AdminUrlListInput from "$lib/components/AdminUrlListInput.svelte";
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
                } else if (type === "leave") {
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

    async function refreshEditions() {
        editions = null;
        let { data, error } = await supabase
            .from("app_special_editions")
            .select("*");
        if (error || data == null || data.length < 1) {
            console.error(error);
        }
        editions = [...data];
        originalEditions = [...data];
    }

    async function saveEditions() {
        // return;
        let { data: delData, error: delError } = await supabase
            .from("app_special_editions")
            .delete()
            .not("id", "is", null);
        if (delError) {
            console.error(delError);
        }

        console.log(editions);
        let { data: insData, error: insError } = await supabase
            .from("app_special_editions")
            .upsert(editions);
        if (insError) {
            console.error(insError);
        }
        console.log("Special editions saved:", editions);
        isModified = false;
    }
    onMount(() => {
        refreshEditions();
    });
    type SpecialEditionItem = {
        article_url: string;
    };
    type SpecialEdition = {
        id: string;
        publish_at: string | null;
        expire_at: string | null;
        title: string;
        style: string;
        image?: string;
        subtitle?: string;
        data: SpecialEditionItem[];
    };

    let editions: SpecialEdition[] | null = $state(null);

    let originalEditions: SpecialEdition[] | null = $state(null);

    let isModified = $derived(
        JSON.stringify(editions) !== JSON.stringify(originalEditions),
    );
    $effect(() => {
        unsavedData = isModified;
    });

    function addEdition() {
        if (editions === null) {
            editions = [];
        }
        const newEdition: SpecialEdition = {
            id: crypto.randomUUID(),
            title: "New Special Edition",
            image: "",
            subtitle: "",
            style: "default",
            publish_at: null,
            expire_at: null,
            data: [],
        };
        editions.push(newEdition);
        selectedIndex = editions.length - 1;
    }

    let selectedIndex: number | null = $state(null);

    async function deleteEdition(edition: SpecialEdition) {
        if (editions == null) return;
        selectedIndex = null;
        editions = editions.filter((c) => c.id !== edition.id);
        let { data: delData, error: delError } = await supabase
            .from("app_special_editions")
            .delete()
            .eq("id", edition.id);
        if (delError) {
            console.error(delError);
        }
    }
</script>

<div
    class="admin-editor-column admin-editor-list-panel admin-editor-sidebar-inner admin-editor-column-noborder"
>
    <h2 class="h2-with-buttons">
        Special Editions
        <div class="button-group">
            {#if isModified}
                <AsyncActionButton action={saveEditions}>Save</AsyncActionButton
                >
            {/if}
            <button
                class="admin-button button-icon"
                onclick={addEdition}
                title="Add Special Edition"
            >
                <i class="ti ti-plus"></i>
            </button>
        </div>
    </h2>

    <div class="list">
        {#if editions === null}
            <div class="admin-grid-loader">
                <i class="ti ti-loader-2"></i>
            </div>
        {:else if editions.length == 0}
            <p>There are no special editions yet. Click [+] to add one.</p>
        {:else}
            {#each editions as edition, i}
                <button
                    class="column-item"
                    class:active={i === selectedIndex}
                    onclick={() => {
                        selectedIndex = i;
                    }}
                >
                    {#if edition.image}
                        <img src={edition.image} alt="" />
                    {/if}
                    <div class="flex-stack">
                        <h3 class="title">{edition.title}</h3>
                        {#if edition.subtitle}
                            <h3 class="byline">{edition.subtitle}</h3>
                        {/if}
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
        Edit Special Edition
        {#if selectedIndex !== null && editions !== null}
            <div class="button-group">
                <AsyncActionButton
                    action={() => deleteEdition(editions![selectedIndex!])}
                >
                    Delete
                </AsyncActionButton>
            </div>
        {/if}
    </h2>

    {#if selectedIndex !== null && editions !== null}
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Title</div>
            <input
                type="text"
                class="admin-editor-input"
                bind:value={editions[selectedIndex].title}
                placeholder="Special edition title"
            />
        </div>

        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Visual Style</div>
            <select
                class="admin-editor-input-dropdown"
                bind:value={editions[selectedIndex].style}
            >
                <option value="" selected disabled hidden
                    >Select an option</option
                >
                <option value={"default"}>Default</option>
                <option value={"magazine"}>Magazine</option>
                <option value={"features"}>Features Supplement</option>
            </select>
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Subtitle</div>
            <textarea
                class="admin-editor-metadata-textarea"
                bind:value={editions[selectedIndex].subtitle}
                placeholder="Special edition description"></textarea>
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Publish Date</div>
            <AdminDateTimeInput
                bind:value={editions[selectedIndex].publish_at}
                emptyLabel="Publish date not set."
            />
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Expiration Date</div>
            <AdminDateTimeInput
                bind:value={editions[selectedIndex].expire_at}
                emptyLabel="Expiration not set."
            />
        </div>
        <MediaLibraryInput
            bind:image={editions[selectedIndex].image}
            {supabase}
            title="Cover Image"
        />
        <AdminUrlListInput
            bind:items={editions[selectedIndex].data}
            title="Articles"
        />
    {:else}
        <p>Select a special edition to edit its properties</p>
    {/if}
</div>

<style>
    .admin-editor-column {
        gap: 0px;
        min-width: unset;
    }
    .admin-editor-list-panel {
        max-width: 340px;
        flex-shrink: 1;
        min-width: 280px;
    }
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
        border-radius: 4px;
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
