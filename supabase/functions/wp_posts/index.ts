// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

Deno.serve(async (req) => {
  let url = new URL(req.url);
  let params = url.searchParams;
  params.forEach((value, key) => {
    console.log(value, key);
  });
  let method = req.method;
  if (method == "GET") {
    let page = Math.max(1, parseInt(params.get("page") ?? "1"));
    let per_page = Math.max(1, parseInt(params.get("per_page") ?? "10"));
    console.log(page, per_page, per_page * (page - 1), (per_page * page) - 1);
    
    function parseList(param: string) {
      return param
          ? param.replace(/\s+/g, "").split(",").filter(Boolean).map(Number)
          : [];
    }
    
    let tags_exclude = params.get("tags_exclude") ?? "";
    let categories_exclude = params.get("categories_exclude") ?? "";
    let tags_include  = params.get("tags") ?? "";
    let categories_include = params.get("categories") ?? "";
    
    let excluded_taxonomies = parseList(tags_exclude).concat(parseList(categories_exclude));
    let included_taxonomies = parseList(tags_include).concat(parseList(categories_include));
    
    const {data, error} = await supabase.rpc("get_wp_articles", {
      page,
      per_page,
      excluded_taxonomies,
      included_taxonomies,
    })
    console.log(data, error)
    
    return new Response(
      JSON.stringify(data),{
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }

  return new Error(method + " not supported");
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/wp_posts' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
