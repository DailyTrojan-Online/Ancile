import {
	createBrowserClient,
	createServerClient,
	isBrowser,
} from "@supabase/ssr";
import {
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SUPABASE_URL,
} from "$env/static/public";
import type { LayoutLoad } from "./$types";
import { getUserPermissions, getUserRole } from "$lib/supabaseHelpers";
import { redirect } from "@sveltejs/kit";

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends("supabase:auth");
	const supabase = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch,
				},
		  })
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch,
				},
				cookies: {
					getAll() {
						return data.cookies;
					},
				},
		  });

	console.log(data.session);
    if(data.session == null) {
        redirect(303, '/');
    }
    let role = await getUserRole(supabase, data.session.user.id);
    let permissions = await getUserPermissions(supabase, data.session.user.id); 
    return { session: data.session, supabase, user: data.session.user, role, permissions };
};
