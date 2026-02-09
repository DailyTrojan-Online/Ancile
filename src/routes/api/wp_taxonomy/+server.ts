import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let params = url.searchParams;

  function parseList(param: string) {
    return param
      ? param.replace(/\s+/g, "").split(",").filter(Boolean).map(Number)
      : [];
  }

  let taxonomy = params.get("taxonomy") ?? "";
  let included_taxonomies = parseList(taxonomy)

  let query = supabase
    .from("wp_taxonomies")
    .select(
      "id:wp_id, slug, name, type" 
    );
  if (included_taxonomies.length > 0) {
    query = query.in("wp_id", included_taxonomies);
  }

  query = query
  const { data, error } = await query;
  if (error) {
    return json({ error: error.message }, { status: 500 });
  } else if (data.length === 0) {
    return json([]);
  }

  return json(data);
}
