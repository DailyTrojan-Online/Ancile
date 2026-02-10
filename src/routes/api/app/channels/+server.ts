import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {

  let query = supabase
    .from("app_notification_channels")
    .select(
      "channel_id, name, description" 
    );

  query = query
  const { data, error } = await query;
  if (error) {
    return json({ error: error.message }, { status: 500 });
  } else if (data.length === 0) {
    return json([]);
  }

  return json(data);
}
