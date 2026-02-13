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
    const payload = await req.json();
    console.log(payload);

    let response = await fetch(
      `https://dailytrojan.com/wp-json/wp/v2/posts/${payload["post_id"]}`,
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

    let id = data.id;
    let slug = data.slug;
    let url = data.link;
    let title = data.title.rendered;
    let date = data.date;
    let author = data.author_field;
    let image = data.yoast_head_json.og_image[0].url;
    let excerpt = data.excerpt.rendered;

    let taxonomy = data.categories.concat(data.tags);

    let clean = "";

    try {
      clean = await cleanHtmlContent(data.content.rendered);
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
      raw_content: data.content.rendered,
      clean_content: clean,
    });

    console.log(data.categories);
    data.categories.forEach((cat: any) => {
      taxonomyJoins.push({
        article_id: id,
        taxonomy_id: cat,
      });
    });
    data.tags.forEach((cat: any) => {
      taxonomyJoins.push({
        article_id: id,
        taxonomy_id: cat,
      });
    });
    console.log(data);
    let taxResponse = await fetch(
      "https://dailytrojan.com/wp-json/wp/v2/tags?post=" + id,
    );
    let taxData = await taxResponse.json();
    let catResponse = await fetch(
      "https://dailytrojan.com/wp-json/wp/v2/categories?post=" + id,
    );
    let catData = await catResponse.json();

    let categories: any[] = [];
    let tags: any[] = [];
    for (let i = 0; i < catData.length; i++) {
      let id = catData[i].id;
      let name = catData[i].name;
      let slug = catData[i].slug;
      let type = "category";
      categories.push({
        wp_id: id,
        name: cleanString(name),
        slug: slug,
        type: "category",
      });
    }
    for (let i = 0; i < taxData.length; i++) {
      let id = taxData[i].id;
      let name = taxData[i].name;
      let slug = taxData[i].slug;
      let type = "tag";
      tags.push({
        wp_id: id,
        name: cleanString(name),
        slug: slug,
        type: "tag",
      });
    }
    let { error: tagError } = await supabase
      .from("wp_taxonomies")
      .upsert(tags, {
        onConflict: "wp_id",
        ignoreDuplicates: true,
      });
    let { error: catError } = await supabase
      .from("wp_taxonomies")
      .upsert(categories, {
        onConflict: "wp_id",
        ignoreDuplicates: true,
      });
    console.log(tagError, catError);
    console.log(articles);
    let { error } = await supabase.from("wp_articles").upsert(articles, {
      onConflict: "wp_id",
      ignoreDuplicates: false,
    });
    let { error: taxonomyJoinError } = await supabase
      .from("wp_article_taxonomy")
      .upsert(taxonomyJoins);
    console.log(taxonomyJoins);
    console.log(error, taxonomyJoinError);
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

async function cleanHtmlContent(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html")!;
  doc.querySelector("[id='article-donation-plug']")?.remove();
  doc.querySelector("[id='ema_signup_form']")?.remove();
  doc.querySelectorAll("br").forEach((e) => e.remove());
  doc.querySelector("[id='column-hdshot']")?.remove();

  var meta: any = Array.from(
    doc.querySelectorAll(".av-post-metadata-container"),
  );
  meta = meta.filter((e: any) => {
    return e.querySelectorAll(".av-post-metadata-published-date").length == 0;
  });
  if (meta.length > 0) {
    var siblings = meta[meta.length - 1].parentNode?.childNodes;
    var index = Array.from(siblings ?? []).indexOf(meta[meta.length - 1]);
    if (index != null && siblings != null) {
      for (var i = siblings.length - 1; i > index; i--) {
        // siblings[i].remove();
      }
    }
    // Traverse up the parent elements and remove any tags that come after the meta element
    var parent = meta[meta.length - 1].parentNode;
    while (parent != null) {
      var parentSiblings = parent.parentNode?.childNodes;
      if (parentSiblings != null) {
        var parentIndex = Array.from(parentSiblings).indexOf(parent as any);
        for (var i = parentSiblings.length - 1; i > parentIndex; i--) {
          parentSiblings[i].remove();
        }
      }
      parent = parent.parentNode;
    }
    meta[meta.length - 1].remove();
  }

  
  var hide = doc.querySelectorAll(
      ".av-mini-hide.av-small-hide.av-medium-hide.av-desktop-hide, .av-mini-hide, .av-small-hide",
  );
  hide.forEach((element: any) => {
    //if any parent has ae-review-score, don't remove
    if(element.parentNode && (element.parentNode).id != "ae-review-score")
      element.remove();
  });

  var newsletterPlug = doc.querySelector("#newsletter-plug-shortcode")
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
