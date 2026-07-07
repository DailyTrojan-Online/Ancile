# Permissions System Implementation

## Overview

This document outlines the complete permissions system implementation for the Ancile admin panel. The system allows:

- **Roles with permissions**: Assign default permissions to roles
- **User-level permission overrides**: Users can have individual permissions that override their role's permissions
- **Dynamic permission management**: Admins can modify permissions on roles and assign/remove permissions from users

## Architecture

### Database Schema

The system uses the following existing tables:

1. **`permissions`** - Master list of all permissions
   - `key` (PRIMARY KEY) - Unique identifier (e.g., "pages.view")
   - `label` - Human-readable label
   - `description` - What the permission does
   - `category` - Permission category for UI grouping

2. **`roles`** - Role definitions
   - `id` (PRIMARY KEY)
   - `name` - Role name
   - `description` - Role description

3. **`role_permissions`** - Permissions assigned to roles
   - `role_id` (FOREIGN KEY) - References `roles.id`
   - `permission_key` (FOREIGN KEY) - References `permissions.key`
   - `value` - boolean flag (true = granted, false = denied/not set)

4. **`user_roles`** - Maps users to roles
   - `user_id` (FOREIGN KEY) - References `admin_users.user_id`
   - `role_id` (FOREIGN KEY) - References `roles.id`

5. **`user_permissions`** - Individual user permission overrides
   - `user_id` (FOREIGN KEY) - References `admin_users.user_id`
   - `permission_key` (FOREIGN KEY) - References `permissions.key`
   - `value` - boolean flag (true = granted, overrides role)

### Permission Resolution Logic

When checking if a user has a permission:

1. Start with all permissions as `false`
2. Apply role permissions (from the role the user is assigned to)
3. Apply user-specific permissions (these override role permissions)

This is implemented in `getUserPermissions()` in `supabaseHelpers.ts`.

### Security Model

**Required Permission**: Users managing permissions must have the `permissions.manage` permission.

All permission modifications go through the `/api/admin/permissions` endpoint which:
1. Verifies the user is authenticated
2. Checks that the user has `permissions.manage` permission
3. Performs the requested operation
4. Logs errors server-side

## File Structure

### New Files Created

- **`src/routes/api/admin/permissions/+server.ts`** - API endpoint for all permission mutations

### Modified Files

- **`src/lib/supabaseHelpers.ts`** - Added helper functions:
  - `getUserPermissionsWithOverrides()` - Get permissions with source tracking
  - `updateUserRole()` - Update a user's role assignment
  - `updateUserPermission()` - Update individual user permissions
  - `updateRolePermission()` - Update role permissions
  - `getRoleWithPermissions()` - Fetch a role with all its permissions

- **`src/routes/(admin)/admin/accounts/+page.svelte`** - Complete rewrite:
  - Wire up permission checkboxes to state management
  - Implement role editing modal and logic
  - Fetch and display current user permissions
  - Save changes through the API endpoint

- **`src/lib/components/CheckboxInput.svelte`** - Enhanced:
  - Added `onchange` callback prop
  - Maintains backward compatibility with `click` prop

## Frontend Implementation

### User Management Modal

When editing a user:
1. Display the user's current role
2. Show all permissions with current state (inherited from role or overridden)
3. Allow toggling permissions on/off
4. Save changes which:
   - Update user name
   - Update user's role assignment
   - Update all individual user permissions

### Role Management Modal

When editing a role:
1. Show role name and description
2. Display all permissions with current assignment state
3. Allow toggling permissions on/off
4. Save changes which update all role permissions

### State Management

Permission state is tracked using `Map<string, boolean>`:
- Key: permission key (e.g., "pages.view")
- Value: boolean indicating if permission is granted

## API Endpoint

### POST `/api/admin/permissions`

**Request Body:**
```json
{
  "type": "user_permission" | "role_permission" | "user_role",
  "userId": "uuid-string",  // For user_permission and user_role
  "roleId": 1,              // For role_permission and user_role
  "permissionKey": "pages.view",  // For user_permission and role_permission
  "value": true             // Permission value (true = grant, false = revoke)
}
```

**Response:**
```json
{
  "success": true,
  "type": "user_permission" | "role_permission" | "user_role"
}
```

**Error Handling:**
- `401` - User not authenticated
- `403` - User lacks `permissions.manage` permission
- `400` - Missing or invalid required fields
- `500` - Server error (see logs)

## Robust and Secure Implementation

### Security Features

1. **Server-side permission checks**: Permission modifications are validated on the server
2. **Authentication required**: All operations require an authenticated user
3. **Explicit permission requirement**: The `permissions.manage` permission is required
4. **Proper error handling**: Detailed error logging without exposing sensitive info to client
5. **Idempotent operations**: Using `upsert` for safe repeated requests

### Robustness Features

1. **Proper cascading**: When users are deleted, permissions are cascaded (db level)
2. **Atomic operations**: Each permission change is a single operation
3. **No orphaned data**: Permissions are only created if the referenced role/permission exists
4. **Consistent state**: UI state is refreshed after successful operations
5. **Error recovery**: Failed operations don't partially update state

### Best Practices

1. **Separation of concerns**: API endpoint handles authorization and validation
2. **Reusable helpers**: Backend helpers can be used by other pages/endpoints
3. **Explicit over implicit**: Permission defaults are explicit, not implicit
4. **Consistent naming**: Permission keys follow a consistent pattern (category.action)
5. **Proper typing**: Full TypeScript support throughout

## Recommendations for Production

### Database Optimization

1. **Add indexes** on frequently queried columns:
   ```sql
   CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
   CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
   CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
   ```

2. **Add a permission audit table** (optional but recommended):
   ```sql
   CREATE TABLE permission_audit_log (
     id BIGSERIAL PRIMARY KEY,
     modified_at TIMESTAMP DEFAULT NOW(),
     modified_by UUID REFERENCES auth.users(id),
     target_user_id UUID,
     target_role_id INTEGER,
     permission_key TEXT,
     old_value BOOLEAN,
     new_value BOOLEAN,
     operation TEXT
   );
   ```

### Permission Policy Enforcement

Add row-level security (RLS) policies to ensure users can't modify permissions they don't have:

```sql
-- Example RLS policy
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_permissions_modify ON user_permissions
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM admin_users 
    WHERE user_id = auth.uid() 
    AND user_id IN (
      SELECT user_id FROM user_roles 
      JOIN role_permissions ON role_permissions.role_id = user_roles.role_id
      WHERE permission_key = 'permissions.manage' AND value = true
    )
  ));
```

### Feature Enhancements to Consider

1. **Bulk permission updates** - Allow assigning multiple permissions at once
2. **Permission inheritance visualization** - Show which permissions come from the role vs. user override
3. **Default roles** - Create templates for common role configurations
4. **Permission history/audit** - Track who changed what permissions and when
5. **Permission validation** - Prevent inadvertently removing a user's own permissions.manage

## Testing the Implementation

### Manual Testing Checklist

- [ ] Load the accounts page
- [ ] Click "Edit User & Permissions" on a user
- [ ] Verify permissions load correctly
- [ ] Toggle a permission and save
- [ ] Verify the permission was saved (reload or check database)
- [ ] Change a user's role and save
- [ ] Verify role change was saved
- [ ] Click "Edit Role" on a role
- [ ] Verify role permissions load
- [ ] Toggle a role permission and save
- [ ] Verify role permission was saved
- [ ] Check that users with that role now have the new permission

### Expected Behavior

- Permission checkboxes should reflect the computed permission value (role + user overrides)
- Saving should immediately update the database
- Role changes should take effect immediately
- Permission changes should cascade to all users with that role (except where overridden)

## Troubleshooting

### Permissions not loading

1. Check that the user has a role assigned (`user_roles` table)
2. Verify the role has permissions assigned (`role_permissions` table)
3. Check browser console for API errors
4. Check server logs for Supabase errors

### Permissions not saving

1. Verify the user has `permissions.manage` permission
2. Check that the permission key exists in the `permissions` table
3. Look for validation errors in the API response
4. Check server logs for database errors

### RLS/Permission Denied Errors

1. Ensure the user has the necessary RLS permissions
2. Verify the user is authenticated (check auth.users table)
3. Check that policies are correctly configured

