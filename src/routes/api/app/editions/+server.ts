import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let params = url.searchParams;
  const now = new Date().toISOString();
  let {data, error} = await supabase
    .from("app_special_editions")
    .select("*")
    .lte("publish_at", now)
    .gte("expire_at", now)
  if (error) {
    console.error(error);
    return json({ error: "Error loading columns" }, { status: 500 });
  }
  return json(data);
}
