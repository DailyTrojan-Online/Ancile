import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let params = url.searchParams;
  let section = params.get("section");
  if (section == null) {
    return json({ error: "Section not specified" }, { status: 400 });
  }
  let {data, error} = await supabase
    .from("app_columns")
    .select("*")
    .eq("section", section);
  if (error) {
    console.error(error);
    return json({ error: "Error loading columns" }, { status: 500 });
  }
  return json(data);
}
