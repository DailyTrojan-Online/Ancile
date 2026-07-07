import { error, fail, redirect } from '@sveltejs/kit'

import type { Actions } from './$types'

export const actions: Actions = {
  login: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      console.error(err)
      return fail(err?.status ?? 404, {error: err?.message});
    } else {
      redirect(303, '/admin')
    }
  },
  resetPassword: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    const { error: err } = await supabase.auth.resetPasswordForEmail(email)
    if (err) {
      console.error(err)
      return fail(err?.status ?? 404, {error: err?.message});
    }
  }
}