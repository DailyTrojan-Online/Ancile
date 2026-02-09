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
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
// const resend = new Resend(Deno.env.get("RESEND_LAYOFF_KEY")!); //RESEND_LAYOFF_KEY Deno.env.get("RESEND_LAYOFF_KEY")!);
Deno.serve(async (req)=>{
  const url = "https://edd.ca.gov/en/jobs_and_training/Layoff_Services_WARN";
  const response = await fetch(url);
  const text = await response.text();
  var somethingChanged = false;
  // Create a simple hash to detect changes
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const hashHex = Array.from(new Uint8Array(hash)).map((b)=>b.toString(16).padStart(2, "0")).join("");
  try {
    // Check stored value
    const { data, error } = await supabase.from("warn_data").select("*").eq("id", "1").single();
    let { data: datl, error: errl } = await supabase.from("warn_data").update({
      last_checked: new Date().toISOString()
    }).eq("id", "1");
    if (error) {
      throw new Error("Supabase error: " + error.message);
    }
    if (!data) {
      throw new Error("No data found in Supabase.");
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const parser = new DOMParser();
    const document = parser.parseFromString(text, "text/html");
    if (!document) {
      throw new Error("Failed to parse HTML document.");
    }
    let excelUrl = null;
    document.querySelectorAll("a").forEach((e)=>{
      if (e.innerText.includes("XLSX")) excelUrl = e.getAttribute("href");
    });
    if (excelUrl && !excelUrl.startsWith("http")) {
      excelUrl = `https://edd.ca.gov${excelUrl}`;
    }
    if (!excelUrl) {
      throw new Error("Failed to find Excel URL.");
    }
    const responseXL = await fetch(excelUrl);
    const arrayBuffer = await responseXL.arrayBuffer();
    if (!responseXL.ok) {
      throw new Error(`HTTP error! status: ${responseXL.status}`);
    }
    const workbook = XLSX.read(arrayBuffer, {
      type: "array"
    });
    let summaryIndex = workbook.SheetNames.indexOf("WARN Report Summary");
    let sheet = workbook.Sheets["WARN Report Summary"];
    if (!sheet) {
      throw new Error("Failed to find 'WARN Report Summary' sheet in Excel file.");
    }
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1
    });
    let employeesAffected = 0;
    jsonData.find((row)=>{
      if (row[0] == "Employees Affected") {
        employeesAffected = row[1];
      }
    });
    if (employeesAffected == 0) {
      throw new Error("Failed to find 'Employees Affected' data in Excel file.");
    }
	if (data.employees_affected != employeesAffected) {
	  somethingChanged = true;
	  // Upload the Excel file to Supabase Storage
	  const fileName = `warn-report-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
	  const { data: uploadData, error: uploadError } = await supabase.storage
		.from("warn-reports")
		.upload(fileName, new Uint8Array(arrayBuffer), {
		  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		  upsert: true
		});
	  if (uploadError) {
		throw new Error("Failed to upload Excel file: " + uploadError.message);
	  }
	  // Get the public URL for the uploaded file
	  const { data: publicUrlData } = supabase.storage
		.from("warn-reports")
		.getPublicUrl(fileName);
	  const fileUrl = publicUrlData?.publicUrl;

	  let { data: dat, error: err } = await supabase.from("warn_data").update({
		employees_affected: employeesAffected
	  }).eq("id", "1");

	  const webhookRequest = new Request(Deno.env.get("SLACK_WEBHOOK_URL"), {
		method: "POST",
		body: JSON.stringify({
		  text: `<!channel> <https://edd.ca.gov/en/jobs_and_training/Layoff_Services_WARN|The WARN Excel spreadsheet> has been updated. This may or may not include USC layoffs. I am sending this message because the summarized total Employees Affected changed from ${data.employees_affected} -> ${employeesAffected}.\n\nYou can download the latest Excel file here: ${fileUrl}`
		}),
		headers: {
		  "content-type": "application/json"
		}
	  });
	  const webhookResponse = await fetch(webhookRequest);
	  console.log("WEBHOOK RESPONSE", webhookResponse.status, await webhookResponse.text());
	  // await resend.emails.send({
	  // 	from: "layoff@newsletter.noahp.xyz",
	  // 	to: "pinales@usc.edu", //editor@dailytrojan.com,digital@dailytrojan.com,managing@dailytrojan.com,associatemanaging@dailytrojan.com
	  // 	subject: "LAYOFF ALERT",
	  // 	html: `<p>The WARN Excel spreadsheet <a href="${url}">${url}</a> has been updated. This may or may not include USC layoffs. I am sending this email because the summarized Total Employees Affected changed from ${data.employees_affected} -> ${employeesAffected}</p>`,
	  // });
	}
  } catch (error) {
    console.error("INTERNAL ERROR:", error);
    const webhookRequest = new Request(Deno.env.get("SLACK_ERR_WEBHOOK_URL"), {
      method: "POST",
      body: JSON.stringify({
        text: `there was an error on the layoff bot webhook. ${error.message}`
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
  if (somethingChanged) {
    return new Response("OK also something changed :)", {
      status: 200
    });
  }
  return new Response("OK", {
    status: 200
  });
});
