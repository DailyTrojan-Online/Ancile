// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { DOMParser } from "jsr:@b-fuze/deno-dom";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
//TODO: REPLACE WITH SECRETS
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
Deno.serve(async (req)=>{
  const url = "https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=D2A34F88-54D5-472A-8325-8B3E15C1B5EE";
  const response = await fetch(url);
  const text = await response.json();
  console.log(text)
  try {
    // Check stored value
    let { data, error } = await supabase.from("sports_facility_data").insert({
      data: text
    });
    if (error) {
      throw new Error("Supabase error: " + error.message);
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("INTERNAL ERROR:", error);
    const webhookRequest = new Request(Deno.env.get("SLACK_ERR_WEBHOOK_URL"), {
      method: "POST",
      body: JSON.stringify({
        text: `there was an error on the sports bot webhook. ${error.message}`
      }),
      headers: {
        "content-type": "application/json"
      }
    });
    const webhookResponse = await fetch(webhookRequest);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
  return new Response("OK", {
    status: 200
  });
});
