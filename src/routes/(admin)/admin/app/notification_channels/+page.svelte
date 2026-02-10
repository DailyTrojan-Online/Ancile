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

    async function refreshChannels() {
        channels = null;
        let { data, error } = await supabase
            .from("app_notification_channels")
            .select("id,channel_id,name,description");
        if (error || !data) {
            console.error(error);
        }
        channels = [...data];
        originalChannels = [...data];
    }

    async function saveChannels() {
        let { data: delData, error: delError } = await supabase
            .from("app_notification_channels")
            .delete()
            .not("id", "is", null);
        if (delError) {
            console.error(delError);
        }

        console.log(channels);
        let { data: insData, error: insError } = await supabase
            .from("app_notification_channels")
            .upsert(channels);
        if (insError) {
            console.error(insError);
        }
        console.log("Columns saved:", channels);
        isModified = false;
    }
    onMount(() => {
        refreshChannels();
    });

    type Channel = {
        id: number;
        channel_id: string;
        name: string;
        description: string;
    };

    let channels: Channel[] | null = $state(null);

    let originalChannels: Channel[] | null = $state(null);

    let isModified = $derived(
        JSON.stringify(channels) !== JSON.stringify(originalChannels),
    );
    $effect(() => {
        unsavedData = isModified;
    });

    function addChannel() {
        if (channels === null) {
            channels = [];
        }
        const newId =
            channels.length > 0
                ? Math.max(...channels.map((c) => c.id)) + 1
                : 1;
        const newChannel: Channel = {
            id: newId,
            name: "New Channel",
            channel_id: "channel_" + newId,
            description: "",
        };
        channels.push(newChannel);
        selectedIndex = channels.length - 1;
    }

    let selectedIndex: number | null = $state(null);

    async function deleteChannel(channel: Channel) {
        if (channels == null) return;
        selectedIndex = null;
        channels = channels.filter((c) => c.id !== channel.id);
        let { data: delData, error: delError } = await supabase
            .from("app_notification_channels")
            .delete()
            .eq("id", channel.id);
        if (delError) {
            console.error(delError);
        }
    }
</script>

<div
    class="admin-editor-column admin-editor-sidebar-inner admin-editor-column-noborder"
>
    <h2 class="h2-with-buttons">
        Channels
        <div class="button-group">
            {#if isModified}
                <AsyncActionButton action={saveChannels}>Save</AsyncActionButton>
            {/if}
            <button
                class="admin-button button-icon"
                onclick={addChannel}
                title="Add Channel"
            >
                <i class="ti ti-plus"></i>
            </button>
        </div>
    </h2>

    <div class="list">
        {#if channels === null}
            <div class="admin-grid-loader">
                <i class="ti ti-loader-2"></i>
            </div>
        {:else if channels.length == 0}
            <p>There are no channels yet. Click [+] to add one.</p>
        {:else}
            {#each channels as channel, i}
                <button
                    class="column-item"
                    class:active={i === selectedIndex}
                    onclick={() => {
                        selectedIndex = i;
                    }}
                >
                    <div class="flex-stack">
                        <h3 class="title">{channel.name}</h3>
                        {#if channel.description}
                            <h3 class="byline">{channel.description}</h3>
                        {/if}
                    </div>
                    <div class="column-id">
                        {channel.channel_id}
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
        Edit Channel
        {#if selectedIndex !== null && channels !== null}
            <div class="button-group">
                <AsyncActionButton
                    action={() => deleteChannel(channels![selectedIndex!])}
                >
                    Delete
                </AsyncActionButton>
            </div>
        {/if}
    </h2>

    {#if selectedIndex !== null && channels !== null}
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">CHANNEL ID</div>
            <input
                type="text"
                class="admin-editor-input"
                bind:value={channels[selectedIndex].channel_id}
                placeholder="Channel ID"
            />
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Name</div>
            <input
                type="text"
                class="admin-editor-input"
                bind:value={channels[selectedIndex].name}
                placeholder="Channel title"
            />
        </div>
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Description</div>
            <textarea
                class="admin-editor-metadata-textarea"
                bind:value={channels[selectedIndex].description}
                placeholder="Column description"
            ></textarea>
        </div>
    {:else}
        <p>Select a channel to edit its properties</p>
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
