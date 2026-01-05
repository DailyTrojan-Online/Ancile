import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let params = url.searchParams;

  let page = Math.max(1, parseInt(params.get("page") ?? "1"));
  let per_page = Math.max(1, parseInt(params.get("per_page") ?? "10"));
  let showContent = params.get("content") ?? "true";

  function parseList(param: string) {
    return param
      ? param.replace(/\s+/g, "").split(",").filter(Boolean).map(Number)
      : [];
  }

  let tags_exclude = params.get("tags_exclude") ?? "";
  let categories_exclude = params.get("categories_exclude") ?? "";
  let tags_include = params.get("tags") ?? "";
  let categories_include = params.get("categories") ?? "";

  let excluded_taxonomies = parseList(tags_exclude).concat(
    parseList(categories_exclude),
  );
  let included_taxonomies = parseList(tags_include).concat(
    parseList(categories_include),
  );
  
  let include_id = params.get("include") ?? "";
  let id_include = parseList(include_id);

  let slug = params.get("slug") ?? "";


  // const { data, error } = await supabase.rpc("get_wp_articles", {
  //   page,
  //   per_page,
  //   excluded_taxonomies,
  //   included_taxonomies,
  // });
  let query = supabase
    .from("wp_articles")
    .select(
      "id:wp_id, slug, url, title, date, author, image, excerpt, taxonomy" +
        (showContent == "true" ? ", content" : ""),
    );
  if (included_taxonomies.length > 0) {
    query = query.contains("taxonomy", included_taxonomies);
  }
  if (excluded_taxonomies.length > 0) {
    let string = "{" + excluded_taxonomies.map((x) => `"${x}"`).join(",") + "}";
    query = query.not("taxonomy", "cs", string);
  }
  
  
  if (id_include.length > 0) {
    query = query.in("wp_id", id_include);
  }
  if (slug.length > 0) {
    query = query.eq("slug", slug);
  }
  
  
  query = query
    .range(per_page * (page - 1), per_page * page - 1)
    .order("date", {
      ascending: false,
    });
  const { data, error } = await query;
  if (error) {
    return json({ error: error.message }, { status: 500 });
  } else if (data.length === 0) {
    return json([]);
  }

  return json(data);
}
