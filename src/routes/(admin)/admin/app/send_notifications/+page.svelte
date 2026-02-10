<script lang="ts">
    import { onMount } from "svelte";
    import MediaLibraryInput from "$lib/components/MediaLibraryInput.svelte";
    import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'
    import { toast , Toaster} from "svelte-sonner";
    import AsyncActionButton from "$lib/components/AsyncActionButton.svelte";

    let { data } = $props();

    let { session, supabase } = data;

    let image = $state("");
    let body = $state("");
    let articleUrl = $state("");
    let title = $state("");

    let channelError = $state(false);
    function sonnerSuccess(msg: string) {
        toast.success(msg);
        console.log('a')
    }

    async function sendNotification() {
        if (chosenChannelId === "") {
            channelError = true;
            return;
        }else {
          channelError = false;
        }
        const { data, error } = await supabase.functions.invoke(
            "breaking_notification",
            {
                body: JSON.stringify({
                    title,
                    image,
                    body,
                    article_url: articleUrl,
                    channel_id: chosenChannelId,
                }),
            },
        );
        if (error instanceof FunctionsHttpError) {
          const errorMessage = await error.context.json()
          console.log('Function returned an error', errorMessage.error)
          sonnerErr(errorMessage.error);
        } else {
          sonnerSuccess("Notification sent!");
        }
    }
    function sonnerErr(msg: string) {
      toast.error(msg);
    }
    let chosenChannelId = $state("");
    let channels: { channel_id: string; name: string; description: string }[] =
        $state([]);

    onMount(async () => {
        const { data, error } = await supabase
            .from("app_notification_channels")
            .select("channel_id, name, description");
        if (error) {
            console.error(error);
        } else {
            channels = data;
        }
    });
</script>


<div class="admin-editor-column admin-editor-sidebar-inner admin-editor-column-noborder" style:padding-top="16px" style:margin-right="auto">
    <div
        class="admin-editor-input-group"
        class:admin-editor-input-group-error={channelError}
    >
        <div class="admin-editor-input-label">Notification Channel</div>
        <select
            class="admin-editor-input-dropdown"
            bind:value={chosenChannelId}
            oninput={()=>{
              channelError = false;
            }}
        >
            <option value="" selected disabled hidden>Select a channel</option>
            {#each channels as channel}
                <option value={channel.channel_id}>{channel.name}</option>
            {/each}
        </select>
    </div>

    {#if channelError}
        <div class="admin-editor-error">
            Please choose a notification channel.
        </div>
    {/if}
    <div class="admin-editor-input-group">
        <div class="admin-editor-input-label">Title</div>
        <input type="text" class="admin-editor-input" bind:value={title} placeholder="Notification Title" />
    </div>
    <div class="admin-editor-input-group">
        <div class="admin-editor-input-label">Body Text</div>
        <input type="text" class="admin-editor-input" bind:value={body} placeholder="Notification Subhed" />
    </div>
    <div class="admin-editor-input-group">
        <div class="admin-editor-input-label">Article URL</div>
        <input type="url" class="admin-editor-input" bind:value={articleUrl} />
    </div>
    <div class="admin-editor-input-group">
        <MediaLibraryInput bind:image {supabase} />
    </div>

    <div class="flex-hor">
        <AsyncActionButton action={sendNotification}
            >Send Notification</AsyncActionButton
        >
    </div>
</div>

<style>
    .admin-editor-column {
        border: none;
    }
</style>
