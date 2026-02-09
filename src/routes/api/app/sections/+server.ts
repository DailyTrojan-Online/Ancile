import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let {data, error} = await supabase
    .from("app_sections")
    .select("*").single();
  if (error) {
    console.error(error);
    return json({ error: "Error loading sections" }, { status: 500 });
  }
  return json(data.data);
}
