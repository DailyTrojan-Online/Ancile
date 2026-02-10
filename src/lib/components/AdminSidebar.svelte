<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import type { SupabaseClient } from "@supabase/supabase-js";
	import { redirect } from "@sveltejs/kit";
	import DtLogo from "./DTLogo.svelte";
	import { onMount } from "svelte";
	import { hasPermission } from "$lib/supabaseHelpers";
	let {
		supabase,
		closed,
		permissions,
		role,
	}: {
		supabase: SupabaseClient;
		closed: boolean;
		permissions: any;
		role: any;
	} = $props();

	let userRoleName = $derived(role.name);

	function signOut() {}
</script>

<div class="admin-sidebar" class:admin-sidebar-closed={closed}>
	<div class="logo">
		<DtLogo></DtLogo>
	</div>
	<div class="gap"></div>
	<div class="button-wrapper">
		<a
			href="/admin"
			class="button-sidebar"
			class:button-sidebar-active={page.url.pathname === "/admin"}
		>
			<i class="ti ti-layout-dashboard"></i>
			<p>Dashboard</p>
		</a>
	</div>
	<div class="divider"></div>
	{#if hasPermission(permissions, "pages.view")}
		<div class="button-wrapper">
			<a
				href="/admin/pages"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/pages"}
			>
				<i class="ti ti-app-window"></i>
				<p>Pages</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "posts.view")}
		<div class="button-wrapper">
			<a
				href="/admin/posts"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/posts"}
			>
				<i class="ti ti-blockquote"></i>
				<p>Posts</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "taxonomy.view")}
		<div class="button-wrapper">
			<a
				href="/admin/tags"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/tags"}
			>
				<i class="ti ti-tags"></i>
				<p>Tags</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "taxonomy.view")}
		<div class="button-wrapper">
			<a
				href="/admin/categories"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/categories"}
			>
				<i class="ti ti-category"></i>
				<p>Categories</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "authors.view")}
		<div class="button-wrapper">
			<a
				href="/admin/authors"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/authors"}
			>
				<i class="ti ti-writing-sign"></i>
				<p>Authors</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "media.view")}
		<div class="button-wrapper">
			<a
				href="/admin/media"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/media"}
			>
				<i class="ti ti-photo"></i>
				<p>Media</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "notifications.send")}
		<div class="button-wrapper">
			<a
				href="/admin/notifications"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/notifications"}
			>
				<i class="ti ti-notification"></i>
				<p>Notifications</p>
			</a>
		</div>
	{/if}
	{#if hasPermission(permissions, "notifications.send")}
		<div class="button-wrapper">
			<a
				href="/admin/accounts"
				class="button-sidebar"
				class:button-sidebar-active={page.url.pathname === "/admin/accounts"}
			>
				<i class="ti ti-users-group"></i>
				<p>Accounts</p>
			</a>
		</div>
	{/if}
	<div class="button-wrapper">
		<a
			href="/admin/wpcache"
			class="button-sidebar"
			class:button-sidebar-active={page.url.pathname === "/admin/wpcache"}
		>
			<i class="ti ti-server-bolt"></i>
			<p>WP Cache</p>
		</a>
	</div>
	<div class="button-wrapper">
		<a
			href="/admin/app"
			class="button-sidebar"
			class:button-sidebar-active={page.url.pathname.includes("app")}
		>
			<i class="ti ti-devices"></i>
			<p>Mobile App</p>
		</a>
	</div>
	<div class="button-wrapper">
		<button class="button-sidebar">
			<i class="ti ti-settings"></i>
			<p>Site Settings</p>
		</button>
	</div>
	<div class="divider"></div>
	<div class="button-wrapper">
		<button class="button-sidebar">
			<i class="ti ti-user-circle"></i>
			<p>Account</p>
		</button>
	</div>
	<div class="button-wrapper">
		<button class="button-sidebar" onclick={signOut}>
			<i class="ti ti-logout"></i>
			<p>Sign Out</p>
		</button>
	</div>

	<div class="user-role">{userRoleName}</div>
</div>

<style>
    
    .divider
    {
        width: 100%;
        height: 1px;
        background: var(--border);
    }
</style>
