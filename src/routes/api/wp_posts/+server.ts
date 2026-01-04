import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let params = url.searchParams;
  console.log(params);

  params.forEach((value, key) => {
    console.log(value, key);
  });
  let page = Math.max(1, parseInt(params.get("page") ?? "1"));
  let per_page = Math.max(1, parseInt(params.get("per_page") ?? "10"));
  console.log(page, per_page, per_page * (page - 1), per_page * page - 1);

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

  const { data, error } = await supabase.rpc("get_wp_articles", {
    page,
    per_page,
    excluded_taxonomies,
    included_taxonomies,
  });
  console.log(data, error);
  if(error ) {
    return json({error: error.message}, {status: 500});
  }
  else if(data.length === 0) {
    return json({error: "No posts found"}, {status: 404});
  }

  return json(data);
}
