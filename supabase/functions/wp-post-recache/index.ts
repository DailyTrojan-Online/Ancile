// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.8.0";

console.log("Hello from Functions!");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    let count = params.get("count") ?? 25;
    let page = params.get("page") ?? 1;
    console.log(count);
    let response = await fetch(
      `https://dailytrojan.com/wp-json/wp/v2/posts?per_page=${count}&page=${page}`,
    );
    let d = await response.text();
    let data = parseWPJson(d);
    let articles: any[] = [];
    let content: {
      article_id: number;
      raw_content: string;
      clean_content: string;
    }[] = [];
    let taxonomyJoins: {
      article_id: number;
      taxonomy_id: number;
    }[] = [];

    let categories: any[] = [];
    let tags: any[] = [];
    data.forEach((a: any) => {
      let id = a.id;
      let slug = a.slug;
      let url = a.link;
      let title = a.title.rendered;
      let date = a.date;
      let author = a.author_field;
      let image = a.yoast_head_json.og_image[0].url;
      let excerpt = a.excerpt.rendered;

      let taxonomy = a.categories.concat(a.tags);

      let clean = "";
      try {
        clean = cleanHtmlContent(a.content.rendered);
      } catch (error) {
        console.error(`Error cleaning article ${id}: ${error}`);
      }

      articles.push({
        wp_id: id,
        slug: slug,
        url: url,
        title: cleanString(title),
        date: date,
        author: author,
        image: image,
        excerpt: cleanString(excerpt),
        taxonomy,
        content: clean,
      });

      content.push({
        article_id: id,
        raw_content: a.content.rendered,
        clean_content: clean,
      });

      a.categories.forEach((cat: any) => {
        taxonomyJoins.push({
          article_id: id,
          taxonomy_id: cat,
        });
      });
      a.tags.forEach((cat: any) => {
        taxonomyJoins.push({
          article_id: id,
          taxonomy_id: cat,
        });
      });
    });

    let { error } = await supabase.from("wp_articles").upsert(articles, {
      onConflict: "wp_id",
      ignoreDuplicates: false,
    });
    return new Response(JSON.stringify({ error: error }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON",
        message: err?.message,
      }),
      { status: 400 },
    );
  }
});

function cleanHtmlContent(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html")!;
  doc.querySelector("[id='article-donation-plug']")?.remove();
  doc.querySelector("[id='ema_signup_form']")?.remove();
  doc.querySelectorAll("br").forEach((e) => e.remove());
  doc.querySelector("[id='column-hdshot']")?.remove();

  var remove: any = Array.from(doc.querySelectorAll(".ancile-remove"));
  remove.forEach((re: any) => {
    re.remove();
  });
  doc.querySelector("#wtpsw-post-list-widget-4")?.remove();
  doc.querySelector("#custom_html-21")?.remove();
  doc.querySelector("#text-14")?.remove();

  var hide = doc.querySelectorAll(
    ".av-mini-hide.av-small-hide.av-medium-hide.av-desktop-hide, .av-mini-hide, .av-small-hide",
  );
  hide.forEach((element: any) => {
    //if any parent has ae-review-score, don't remove
    if (element.parentNode && element.parentNode.id != "ae-review-score")
      element.remove();
  });

  var newsletterPlug = doc.querySelector("#newsletter-plug-shortcode");
  newsletterPlug?.remove();

  function removeEmptyElements(element: Element) {
    Array.from(element.children).forEach((child) => {
      removeEmptyElements(child);
    });
    let hasNonTextContent =
      Array.from(element.children).some(
        (child: any) =>
          child.localName == "img" ||
          child.localName == "iframe" ||
          child.localName == "video" ||
          child.localName == "audio" ||
          child.localName == "svg" ||
          child.localName == "picture",
      ) ||
      element.localName == "img" ||
      element.localName == "iframe" ||
      element.localName == "video" ||
      element.localName == "audio" ||
      element.localName == "svg" ||
      element.localName == "picture";
    if (
      element.children.length === 0 &&
      (element as HTMLElement).innerText.trim().length === 0 &&
      !hasNonTextContent
    ) {
      element.remove();
    }
  }

  removeEmptyElements(doc.body);

  const cleaned = doc.body.innerHTML;

  return cleaned;
}

function cleanString(str: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div>${str.replace(/\n/g, "")}</div>`,
    "text/html",
  );
  return doc?.body?.textContent || "";
}

function parseWPJson(data: string) {
  let i = data.lastIndexOf("}");
  let repairedData = jsonrepair(data.substring(0, i + 1));
  let wpData = JSON.parse(repairedData);
  return wpData;
}
