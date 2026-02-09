import type { Component } from "svelte";
import { Block, Lithograph, type BlockSaveData } from "../lithograph";
import PostSettings from "$lib/components/LithographSettings/PostSettings.svelte";


export type PostBlockImagePosition = "none" | "left" | "right" | "top" | "bottom"

export type PostBlockSaveData = {
    limit: number;
    offset: number;
    tags: string[];
    categories: string[];
    sortBy: 'date' | 'popularity'
    sortOrder: 'asc' | 'desc';
    includeSticky: boolean;
    imagePosition: PostBlockImagePosition;
    showHeadline: boolean;
    showSubheadline: boolean;
    showByline: boolean;
    showPublishDate: boolean;
}

export class PostBlock extends Block {
    imagePosition: PostBlockImagePosition = "none";
    showHeadline: boolean = true;
    showSubheadline: boolean = true;
    showByline: boolean = true;
    showPublishDate: boolean = true;
    constructor(editor: Lithograph, parent: Block | null) {
        super(editor, parent);
        this.title = "Posts";
        this.icon = `<i class="ti ti-news"></i>`;
    }

    static get blockType() {
        return "content"
    }
    static get blockName() {
        return "post"
    }
    setData(data: PostBlockSaveData): void {
        console.log(data)
        this.imagePosition = data.imagePosition;
        this.showHeadline = data.showHeadline;
        this.showSubheadline = data.showSubheadline;
        this.showByline = data.showByline;
        this.showPublishDate = data.showPublishDate;
    }

    createBlock() {
        super.createBlock();
        let d = document.createElement("div");
        d.classList.add("led-post-block-preview");
        d.innerHTML = this.render();
        this.contentContainer.appendChild(d);
    }
    render() {
        return `yooooo dummy post`;
    }
    save(): BlockSaveData<PostBlockSaveData> {
        return {
            type: "post",
            id: this.id,
            data: {
                limit: 10,
                offset: 0,
                tags: [],
                categories: [],
                sortBy: 'date',
                sortOrder: 'desc',
                includeSticky: false,
                imagePosition: this.imagePosition,
                showHeadline: this.showHeadline,
                showSubheadline: this.showSubheadline,
                showByline: this.showByline,
                showPublishDate: this.showPublishDate
            },
            html_id: this.htmlId,
            classes: this.classes
        }
    }

    getSettingsModal() {
        return PostSettings;
    }
}
