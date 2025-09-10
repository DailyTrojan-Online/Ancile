<script lang="ts">
	import AdminGrid from "$lib/components/AdminGrid.svelte";
	import AdminModal from "$lib/components/AdminModal.svelte";
	import CheckboxInput from "$lib/components/CheckboxInput.svelte";
	import LoadingButton from "$lib/components/LoadingButton.svelte";
	import MediaLibraryInput from "$lib/components/MediaLibraryInput.svelte";
	import { getAllRoles } from "$lib/supabaseHelpers.js";
	import { onMount } from "svelte";

	let { data } = $props();

	let { session, supabase } = data;

	let image = $state("");
	let body = $state("");
	let articleUrl = $state("");
	let show = $state("users");

	let displayFields = [
		{
			label: "Name",
			key: "name",
		},
		{
			label: "Email",
			key: "email",
		},
		{
			label: "Role",
			renderer: roleDropdown,
		},
		{
			label: "",
			renderer: editButton,
		},
	];
	let displayFieldsRoles = [
		{
			label: "Name",
			key: "name",
		},
		{
			label: "Permissions",
			renderer: roleChipList,
		},
		{
			label: "",
			renderer: editRoleButton,
		},
	];
	let accounts: any = $state(null);
	let roles: any = $state(null);

	async function fetchAccounts() {
		let { data: accounts, error } = await supabase
			.from("admin_users")
			.select("name, user_id, roles(name), email");
		console.log(accounts, error);
		return accounts;
	}

	async function fetchRoles() {
		let roles = await getAllRoles(supabase);
		console.log(roles);
		return roles;
	}

	onMount(() => {
		initData();
	});

	async function initData() {
		accounts = null;
		roles = null;
		accounts = await fetchAccounts();
		roles = await fetchRoles();
		getAllPermissions();

	}

	let showInviteModal = $state(false);
	let showUserManageModal = $state(false);

	let email = $state("");

	function sendInvitation() {
		//need to implement admin system for this, this needs to have three authentication checks:
		//1. the user is logged in
		//2. the user has accounts.invite permission
		//3. the call must be an api call on the server that uses the admin api. these checks must happen on the server
	}

	let permissions = $state(new Array());
	let permissionsCategories = $state(new Array());

	async function getAllPermissions() {
		let { data, error } = await supabase.from("permissions").select("*");
		if (error) {
			console.error(error);
			return;
		}
		if (data) {
			permissions = data;
		}

		permissions.forEach((p) => {
			if (!permissionsCategories.includes(p.category) && p.category != null) {
				permissionsCategories.push(p.category);
			}
		});
		console.log(permissionsCategories);
	}

	let selectedUser: any = $state(null);
	let selectedUserName = $state("");
	let selectedUserRole = $state("");

	function selectUser(user: any) {
		selectedUser = user;
		console.log(selectedUser)
		selectedUserRole = user.roles[0]?.name ?? "";
		console.log(selectedUserRole)
		showUserManageModal = true;
		selectedUserName = user.name ?? "";
	}

	let userLoading = $state(false);

	async function saveUserChanges() {
		//first we need to delete anything in the user_roles table for this user
		userLoading = true;
		if(!selectedUser) {userLoading = false; return;}
		console.log(selectedUser)
		let {data, error} = await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
		console.log(data, error);
		if(error) {
			console.error(error);
			userLoading = false; 
			return;
		}
		//now we need to insert new role
		console.log(roles)
		let {data: roleData, error: roleError} = await supabase.from("user_roles").upsert({
			user_id: selectedUser.user_id,
			role_id: roles.find((r: any) => r.name == selectedUserRole)?.id
		})
		console.log(roleData, roleError);
		if(roleError) {
			console.error(roleError);
			userLoading = false; 
			return;
		}
		//now, update selected user
		let {data: userData, error: userError} = await supabase.from("admin_users").update({
			name: selectedUserName
		}).eq("user_id", selectedUser.user_id);
		console.log(userData, userError);
		showUserManageModal = false;
		userLoading = false; 
		initData();
	}
</script>

{#snippet roleDropdown(data: any)}
	<div class="admin-chip">
		{data.roles[0]?.name ?? "No Role"}
	</div>
{/snippet}
{#snippet roleChipList(data: any)}
	<div class="admin-chip-list">
		{#each data.role_permissions as permission}
			<div class="admin-chip">{permission.permissions.label}</div>
		{/each}
	</div>
{/snippet}
{#snippet editButton(data: any)}
	<button class="admin-grid-button button-sub admin-row-visible-on-hover">
		<i class="ti ti-pencil"></i>Edit User & Permissions
	</button>
{/snippet}
{#snippet editRoleButton(data: any)}
	<button class="admin-grid-button button-sub admin-row-visible-on-hover">
		<i class="ti ti-pencil"></i>Edit Role
	</button>
{/snippet}

<div class="admin-page-content">
	<div class="admin-page-header">
		<div class="admin-buttons">
			<div class="admin-editor-tab-selector">
				<button
					class="admin-editor-tab-button"
					class:active={show == "users"}
					onclick={() => (show = "users")}>Users</button
				><button
					class="admin-editor-tab-button"
					class:active={show == "roles"}
					onclick={() => (show = "roles")}>Roles</button
				>
			</div>
			{#if show == "users"}
				<button
					class="button-primary admin-button"
					onclick={() => (showInviteModal = true)}
					><i class="ti ti-user-plus"></i>Invite User</button
				>
			{:else if show == "roles"}
				<button
					class="button-primary admin-button"
					onclick={() => (showInviteModal = true)}
					><i class="ti ti-plus"></i>Add Role</button
				>
			{/if}
		</div>
	</div>

	<div class="admin-editor">
		<div class="admin-editor-fullwidth">
			{#if show == "users"}
				<AdminGrid
					{displayFields}
					showCheckboxes={false}
					callback={selectUser}
					data={accounts}
					columnWidths={"250px 200px 180px 1fr"}
				></AdminGrid>
			{:else if show == "roles"}
				<AdminGrid
					displayFields={displayFieldsRoles}
					showCheckboxes={false}
					callback={()=>{}}
					data={roles}
					columnWidths={"250px 600px 1fr"}
				></AdminGrid>
			{/if}
		</div>
	</div>
</div>

<AdminModal bind:open={showInviteModal}
	><div class="admin-modal-content invite-modal">
		<div class="admin-editor-column">
			<h2>Invite User</h2>

			<div class="admin-editor-input-group">
				<div class="admin-editor-input-label">Email</div>
				<input type="email" class="admin-editor-input" />
			</div>

			<div class="flex-hor flex-right">
				<button class="admin-button button-primary" onclick={sendInvitation}
					>Send Invitation</button
				>
			</div>
		</div>
	</div>
</AdminModal>
<AdminModal bind:open={showUserManageModal}>
	<div class="admin-modal-content right-modal">
		<!-- <button class="admin-button admin-modal-action-button" onclick={saveUserChanges}>Save</button> -->
		<LoadingButton classes="admin-button admin-modal-action-button" loading={userLoading} onclick={saveUserChanges}>Save</LoadingButton>
		<div class="admin-editor-column admin-editor-sidebar-inner">
			<div class="admin-editor-sidebar-section">
				<h2>Edit User</h2>

				<div class="admin-editor-input-group">
					<div class="admin-editor-input-label">Display Name</div>
					<input type="email" class="admin-editor-input" bind:value={selectedUserName}/>
				</div>

				<div class="admin-editor-input-group">
					<div class="admin-editor-input-label">Role</div>
					<select class="admin-editor-input-dropdown" bind:value={selectedUserRole}>
						{#each roles as role}
							<option value={role.name}>{role.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="admin-editor-sidebar-section">
				<h2>Edit Permissions</h2>
				<p style:margin-top="-12px" style:margin-bottom="-6px">
					Permissions set on the user override permissions set at the role
					level. To modify role permissions, go to the Roles tab.
				</p>
				<div class="admin-editor-checkbox-list">
					{#each permissions.filter((p) => p.category == null) as permission}
						<div
							class="admin-editor-input-group admin-editor-input-group-horizontal admin-editor-input-group-underline"
						>
							<span>
								<h4 class="admin-editor-input-title">{permission.label}</h4>
								<p class="admin-editor-input-description">
									{permission.description}
								</p>
							</span>
							<CheckboxInput value={true} />
						</div>
					{/each}
				</div>
				{#each permissionsCategories as category}
					<h3>{category}</h3>
					<div class="admin-editor-checkbox-list">
						{#each permissions.filter((p) => p.category == category) as permission}
							<div
								class="admin-editor-input-group admin-editor-input-group-horizontal admin-editor-input-group-underline"
							>
								<span>
									<h4 class="admin-editor-input-title">{permission.label}</h4>
									<p class="admin-editor-input-description">
										{permission.description}
									</p>
								</span>
								<CheckboxInput value={true} />
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
</AdminModal>

<style>
	.invite-modal {
		width: 350px !important;
		height: fit-content;
	}
	.right-modal {
		width: 500px !important;
		height: 100vh !important;
		max-height: unset !important;
		border-radius: 0 !important;
		transform: translate(0, -50%);

		animation: 0.2s slide-in;
		right: 0 !important;
		left: unset !important;
	}
	@keyframes slide-in {
		from {
			transform: translate(40px, -50%);
			opacity: 0;
		}
		to {
			transform: translate(0, -50%);
			opacity: 1;
		}
	}
	.admin-editor-column {
		border: none;
		padding-top: 0;
	}

	.admin-editor-column h2 {
		padding-top: 20px;
		padding-bottom: 15px;
	}
	.right-modal .admin-editor-column {
		max-width: unset;
	}
	.admin-editor-tab-selector {
		height: 100%;
		display: flex;
		align-items: center;
	}

	.admin-editor-tab-button {
		height: 100%;
		font-size: 18px;
		font-weight: 500;
		background: transparent;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		font-family: "Geist";
		margin-right: 16px;
		opacity: 0.4;
		cursor: pointer;
		box-sizing: border-box;
		position: relative;
		box-shadow: inset 0 -3px 0 0 transparent;
	}
	.admin-editor-tab-button:hover {
		opacity: 1;
	}
	.admin-editor-tab-button.active {
		box-shadow: inset 0 -3px 0 0 var(--accent);
		opacity: 1;
	}
</style>
