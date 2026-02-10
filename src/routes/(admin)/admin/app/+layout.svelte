<script lang="ts">
    import SectionManager from "$lib/components/AppSettings/SectionManager.svelte";
    import ColumnManager from "$lib/components/AppSettings/ColumnManager.svelte";
    import { Toaster, toast } from "svelte-sonner";
    import {page} from "$app/stores";

    let { data , children} = $props();
    let { supabase } = $derived(data);
    
    

    let columnsUnsaved = $state(false);
    let sectionsUnsaved = $state(false);
    $inspect(columnsUnsaved);
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
            <a
                class="admin-editor-page-switcher-button"
                class:active={$page.url.pathname.includes("dashboard")}
                href="./dashboard">Dashboard</a
            >
            <a
                class="admin-editor-page-switcher-button"
                class:active={$page.url.pathname.includes("sections")}
                href="./sections">Sections</a
            >
            <a
                class="admin-editor-page-switcher-button"
                class:active={$page.url.pathname.includes("columns")}
                href="./columns">Columns</a
            >
            <a
                class="admin-editor-page-switcher-button"
                class:active={$page.url.pathname.includes("notification_channels")}
                href="./notification_channels">Notification Channels</a
            >
            <a
                class="admin-editor-page-switcher-button"
                class:active={$page.url.pathname.includes("send_notifications")}
                href="./send_notifications">Send Notifications</a
            >
        </div>
        <div class="admin-editor">
            {@render children()}
        </div>
    </div>
</div>

<style>
    .admin-editor-page-switcher {
        width: 250px;
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
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
