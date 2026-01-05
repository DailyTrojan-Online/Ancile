
import { json } from "@sveltejs/kit";

export async function GET({ locals: { supabase }, url, request }) {
  let params = url.searchParams;
  console.log(params);

  params.forEach((value, key) => {
    console.log(value, key);
  });
  let term = params.get("search") ?? "";
  let page = Math.max(1, parseInt(params.get("page") ?? "1"));
  let per_page = Math.max(1, parseInt(params.get("per_page") ?? "10"));
  console.log(page, per_page, per_page * (page - 1), per_page * page - 1);

  function parseList(param: string) {
    return param
      ? param.replace(/\s+/g, "").split(",").filter(Boolean).map(Number)
      : [];
  }
  
  console.log(term);

  const { data, error } = await supabase.from("wp_articles").select("*").textSearch(
    "fts",
    term,
    {
      type: "websearch"
    }
  ).range(per_page * (page - 1), per_page * page - 1).order("date", {
    ascending: false
  });
  if(error ) {
    return json({error: error.message}, {status: 500});
  }
  else if(data.length === 0) {
    return json({error: "No posts found"}, {status: 404});
  }

  return json(data);
}

