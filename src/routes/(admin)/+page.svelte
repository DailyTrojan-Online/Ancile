<script lang="ts">
    import AuthUi from "$lib/components/AuthUI.svelte";
    import type { ActionData } from "./$types";
    let reset = $state(false);
    let { form }: { form: ActionData } = $props();
</script>

<AuthUi>
    {#if !reset}
        <h1>Login</h1>
        <form method="POST" action="?/login">
            <label>
                Email
                <input name="email" type="email" />
            </label>
            <label>
                Password
                <input name="password" type="password" />
            </label>
            {#if form?.error}<p class="admin-auth-error">{form?.error}</p>{/if}
            <button type="submit"> Login </button>
        </form>
        <button class="button-secondary" onclick={() => (reset = true)}
            >Forgot Password? <u>Reset</u></button
        >
    {:else}
        <h1>Reset Password</h1>
        <form method="POST" action="?/resetPassword">
            <label>
                Email
                <input name="email" type="email" />
            </label>
            <button type="submit"> Reset Password </button>
        </form>
        <button class="button-secondary" onclick={() => (reset = true)}
            >Log In</button
        >
    {/if}
</AuthUi>
