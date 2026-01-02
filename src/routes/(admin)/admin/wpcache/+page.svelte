<script lang="ts">
    import { onMount } from "svelte";
    import { jsonrepair } from "jsonrepair";

    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import AdminGrid from "$lib/components/AdminGrid.svelte";

    import { closeModalById, openModal } from "$lib/modalManager.svelte";
    import { extractFromHtml } from "@extractus/article-extractor";

    let { data } = $props();

    let { session, supabase } = data;

    let maxPageSize = 50;
    let totalCount = $state(0);
    let pageCount = $derived(Math.ceil(totalCount / maxPageSize));
    let page = $state(1);

    type WPArticle = {
        wp_id: number;
        slug: string;
        url: string;
        title: string;
        date: string;
        author: string;
        image: string;
        excerpt: string;
    };
    let displayFields = [
        {
            label: "Image",
            renderer: imageField,
        },
        {
            label: "Title",
            key: "title",
        },
        {
            label: "Author",
            key: "author",
        },
        {
            label: "Publish Date",
            key: "date",
        },
    ];

    async function ingestArticles(amount = 100, page = 1) {
        let response = await fetch(
            `https://dailytrojan.com/wp-json/wp/v2/posts?per_page=${amount}&page=${page}`,
        );
        let data = await response.text();
        let i = data.lastIndexOf("}");
        let repairedData = jsonrepair(data.substring(0, i + 1));
        let wpData = JSON.parse(repairedData);
        let articles: WPArticle[] = [];
        let content: {
            article_id: number;
            raw_content: string;
            clean_content: string;
        }[] = [];
        for (let i = 0; i < wpData.length; i++) {
            let id = wpData[i].id;
            let slug = wpData[i].slug;
            let url = wpData[i].link;
            let title = wpData[i].title.rendered;
            let date = wpData[i].date;
            let author = wpData[i].yoast_head_json.author;
            let image = wpData[i].yoast_head_json.og_image[0].url;
            let excerpt = wpData[i].excerpt.rendered;

            articles.push({
                wp_id: id,
                slug: slug,
                url: url,
                title: cleanString(title),
                date: date,
                author: author,
                image: image,
                excerpt: cleanString(excerpt),
            });
            let clean ="";
            
            try {
                clean = await cleanHtmlContent(wpData[i].content.rendered);
            } catch (error) {
                console.error(
                    `Error cleaning article ${id}: ${error}`,
                );
            }

            content.push({
                article_id: id,
                raw_content: wpData[i].content.rendered,
                clean_content: clean,
            });
        }
        let { error } = await supabase.from("wp_articles").upsert(articles, {
            onConflict: "wp_id",
            ignoreDuplicates: true,
        });
        let { error: contentError } = await supabase
            .from("wp_article_content")
            .upsert(content, {
                onConflict: "article_id",
                ignoreDuplicates: true,
            });
    }

    function cleanString(str: string) {
        let div = document.createElement("div");
        div.innerHTML = str.replace(/\n/g, "");
        return div.textContent || div.innerText || "";
    }

    onMount(async () => {
        refresh();

        let offset = 10;

        for (let i = offset; i <= offset + 10; i++) {
            // ingestArticles(100, i);
        }
    });

    async function ingestTotalCountOfArticles(count: number, page = 1) {
        ingesting = true;
        ingestMax = count;
        ingestStatus = 0;
        if (count < 100) {
            await ingestArticles(count, page);
            ingestStatus = count;
        } else {
            for (let i = 0; i < count; i += 100) {
                await ingestArticles(100, page++);
                ingestStatus += 100;
            }
        }
        ingesting = false;
        closeModalById(ingestModalId);
    }

    let ingestMax = $state(1);
    let ingestStatus = $state(0);
    let ingestPage = $state(0);

    let loadedCache: WPArticle[] | null = $state([]);

    async function refresh() {
        loadedCache = null;
        loadedCache = await loadCache();
    }
    async function loadCache(): Promise<WPArticle[] | null> {
        const { count } = await supabase
            .from("wp_articles")
            .select("*", { count: "exact", head: true });
        totalCount = count ?? 0;
        if (page > pageCount) {
            page = pageCount;
        }
        let query = supabase
            .from("wp_articles")
            .select("*")
            // .order("name", { ascending: true })
            .range((page - 1) * maxPageSize, page * maxPageSize - 1);
        let { data } = await query;

        return data;
    }

    function pageChange(newPage: number) {
        page = newPage;
        refresh();
    }

    let rawContent = $state("");
    let cleanContent = $state("");

    async function openComparisonModal(article: WPArticle) {
        rawContent = "";
        openModal(contentComparisonModal, "snippet", "center");

        let content = await fetchArticleContent(article.wp_id);
        rawContent = content.raw_content;
        cleanContent = await cleanHtmlContent(rawContent);
    }

    async function fetchArticleContent(articleId: number) {
        const { data } = await supabase
            .from("wp_article_content")
            .select("*")
            .eq("article_id", articleId)
            .single();
        return data;
    }

    async function cleanHtmlContent(html: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelector("[id='article-donation-plug']")?.remove();
        doc.querySelector("[id='ema_signup_form']")?.remove();
        doc.querySelectorAll("br").forEach((e) => e.remove());
        doc.querySelector("[id='column-hdshot']")?.remove();

        var meta = Array.from(
            doc.querySelectorAll(".av-post-metadata-container"),
        );
        meta = meta.filter((e) => {
            return (
                e.querySelectorAll(".av-post-metadata-published-date").length ==
                0
            );
        });
        if (meta.length > 0) {
            var siblings = meta[meta.length - 1].parentNode?.childNodes;
            var index = Array.from(siblings ?? []).indexOf(
                meta[meta.length - 1],
            );
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
                    var parentIndex = Array.from(parentSiblings).indexOf(
                        parent as any,
                    );
                    for (
                        var i = parentSiblings.length - 1;
                        i > parentIndex;
                        i--
                    ) {
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
        hide.forEach((element) => {
            element.remove();
        });

        var hrEls = doc.querySelectorAll("hr");
        hrEls.forEach((hr) => {
            var next = hr.nextElementSibling;
            if (next != null && next.innerHTML.includes("Daily")) {
                var nextNext = next.nextElementSibling;
                if (
                    nextNext != null &&
                    nextNext.innerHTML.includes("Subscribe")
                ) {
                    hr.remove();
                    next.remove();
                    nextNext.nextElementSibling?.remove();
                    nextNext.remove();
                }
            }
        });

        function removeEmptyElements(element: Element) {
            Array.from(element.children).forEach((child) => {
                removeEmptyElements(child);
            });
            let hasNonTextContent =
                Array.from(element.children).some(
                    (child) =>
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

    let totalCleaned = $state(0);

    async function batchCleanArticles() {
        openModal(cleanProgressModal, "snippet", "center");
        let batchSize = 1000;
        for (let i = 0; i < Math.ceil(totalCount / batchSize); i++) {
            let { data: articleContents, error } = await supabase
                .from("wp_article_content")
                .select("*")
                .range(i * batchSize, (i + 1) * batchSize);

            if (!articleContents || error) {
                continue;
            }
            articleContents.forEach(async (article) => {
                let raw = article.raw_content;
                let cleaned = "";
                try {
                    cleaned = await cleanHtmlContent(raw);
                } catch (error) {
                    console.error(
                        `Error cleaning article ${article.id}: ${error}`,
                    );
                }
                let { data, error: err } = await supabase
                    .from("wp_article_content")
                    .update({ clean_content: cleaned })
                    .eq("id", article.id);
                totalCleaned++;
            });
        }
    }

    function openIngestModal() {
        ingestModalId = openModal(ingestModal, "snippet", "center");
    }
    let ingestValue = $state(0);
    let ingesting = $state(false);
    let ingestModalId = $state("");
    function ingestFromModal() {
        ingestTotalCountOfArticles(ingestValue, ingestPage);
    }
</script>

{#snippet imageField(data: any)}
    <img class="admin-grid-image" src={data.image} alt="" />
{/snippet}

<div class="admin-page-content">
    <div class="admin-page-header">
        <div class="admin-buttons">
            <h1>WordPress Cache</h1>
            <RefreshButton {refresh}></RefreshButton>
            <p>{totalCount} posts cached</p>
            <Pagination {pageCount} onChange={pageChange} bind:page
            ></Pagination>
            <button onclick={batchCleanArticles}>clean</button>
            <button onclick={openIngestModal}>ingest</button>
        </div>
    </div>

    <div class="admin-editor">
        <div class="admin-editor-fullwidth">
            <AdminGrid
                {displayFields}
                showCheckboxes={false}
                callback={openComparisonModal}
                data={loadedCache!}
                columnWidths={"90px 350px 200px 1fr"}
            ></AdminGrid>
        </div>
    </div>
</div>

{#snippet contentComparisonModal()}
    <div class="admin-modal-content">
        <div class="admin-raw-preview">
            {@html rawContent}
        </div>
        <div class="admin-clean-preview">
            {@html cleanContent}
        </div>
    </div>
{/snippet}

{#snippet cleanProgressModal()}
    <div class="admin-modal-content invite-modal">
        <div class="admin-editor-column admin-editor-column-noborder">
            <h2>Batch Cleaning Articles</h2>
            <div
                class="progress-bar"
                style:--progress={`${(totalCleaned / totalCount) * 100}%`}
            ></div>
            {Math.min(totalCleaned, totalCount)} articles cleaned
        </div>
    </div>
{/snippet}
{#snippet ingestModal()}
    <div class="admin-modal-content invite-modal">
        <div class="admin-editor-column admin-editor-column-noborder">
            <h2>
                Ingest Articles
            </h2>

            <div class="admin-editor-input-group">
                <div class="admin-editor-input-label">Articles to Ingest</div>
                <input
                    type="number"
                    class="admin-editor-input"
                    bind:value={ingestValue}
                />
            </div>
            <div class="admin-editor-input-group">
                <div class="admin-editor-input-label">Ingest Page Offset</div>
                <input
                    type="number"
                    class="admin-editor-input"
                    bind:value={ingestPage}
                />
            </div>

            <div
                class="progress-bar"
                style:--progress={`${(ingestStatus / ingestMax) * 100}%`}
            ></div>
            {Math.min(ingestStatus, ingestMax)} articles ingested
            <div class="flex-hor flex-right">
                <button
                    class="admin-button button-primary"
                    onclick={ingestFromModal}>Ingest</button
                >
            </div>
        </div>
    </div>
{/snippet}

<style>
    .admin-modal-content {
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }
    .admin-raw-preview,
    .admin-clean-preview {
        width: 50%;
        height: 100%;
        padding: 10px;
        box-sizing: border-box;
        overflow: auto;
    }
    :global(.admin-raw-preview a, .admin-clean-preview a) {
        color: var(--cardinal);
        text-decoration: underline;
    }
    :global(.admin-raw-preview img, .admin-clean-preview img) {
        max-width: 100%;
        height: auto;
    }
    .progress-bar {
        width: 100%;
        height: 10px;
        background-color: #f3f3f3;
        border-radius: 5px;
        overflow: hidden;
    }
    .progress-bar::before {
        content: "";
        display: block;
        height: 100%;
        background-color: var(--cardinal);
        width: var(--progress);
        transition: 0.1s;
    }
</style>
