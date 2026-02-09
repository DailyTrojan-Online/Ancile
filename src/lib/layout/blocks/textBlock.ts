import { Editor } from "@tiptap/core";
import { Block, type Lithograph, type BlockSaveData } from "../lithograph";
import { computePosition, offset } from "@floating-ui/core";
import { platform } from "@floating-ui/dom";

import TextSettings from "$lib/components/LithographSettings/TextSettings.svelte";

export type TextBlockSaveData = {
    content: string;
}

export class TextBlock extends Block {
    editorContainer!: HTMLElement;
    closeButton!: HTMLElement;
    styleBar!: HTMLElement;
    rect!: DOMRect;
    linkTooltip?: HTMLElement;
    tiptapLinkBubbleMenu!: HTMLElement;
    content: string = ""
    static fonts = [
        "Inter",
        "Geist",
        "Geist Mono",
        "Source Serif 4",
    ];
    tiptapLinkBubbleMenuURL!: HTMLInputElement;
	constructor(editor: Lithograph, parent: Block | null) {
		super(editor, parent);
		this.title = "Text";
        this.icon = `<i class="ti ti-align-justified"></i>`
	}

    static get blockType() {
        return "content"
    }

    static get blockName() {
        return "text"
    }

	setData(data: any) {
        this.content = data.content;
        this.editorContainer.innerHTML = this.content;
    }


    createLinkEditUI(deleteButton: boolean = false): HTMLElement[] {
        let url = document.createElement("input");
        url.placeholder = "Enter URL";
        url.classList.add("led-tooltip-input");
        let completeButton = document.createElement("button");
        completeButton.innerHTML = `<i class="ti ti-check"></i>`;
        completeButton.classList.add("led-tooltip-button");
        completeButton.onclick = (() => {
            // this.textEditor.chain().focus().extendMarkRange('link').setLink({ href: url.value }).run();
            this.editor.closeTooltip(this.linkTooltip!);
        }).bind(this);
        if(deleteButton) {
            let deleteButton = document.createElement("button");
            deleteButton.innerHTML = `<i class="ti ti-trash"></i>`;
            deleteButton.classList.add("led-tooltip-button");
            deleteButton.onclick = (() => {
                // this.textEditor.chain().focus().unsetLink().run();
                this.editor.closeTooltip(this.linkTooltip!);
            }).bind(this);
            return [url, completeButton, deleteButton];
        }

        return [url, completeButton];

    }

    createLink(button: HTMLElement) {
        this.linkTooltip = this.editor.createTooltip(button, this.createLinkEditUI());
    }

	createBlock() {
		super.createBlock();
		this.editorContainer = document.createElement("div");
		this.editorContainer.classList.add("led-text-block-preview");
        this.editorContainer.innerHTML = this.content;
		this.contentContainer.appendChild(this.editorContainer);
        this.tiptapLinkBubbleMenu = document.createElement("div");
        this.tiptapLinkBubbleMenu.classList.add("led-tooltip");
        this.tiptapLinkBubbleMenu.classList.add("led-tooltip-hidden");
        let ui = this.createLinkEditUI(true);
        this.tiptapLinkBubbleMenuURL = ui[0] as HTMLInputElement;
        ui.forEach((el) => {
            this.tiptapLinkBubbleMenu.appendChild(el);
        })
        this.editor.container.appendChild(this.tiptapLinkBubbleMenu);
        console.log(this.tiptapLinkBubbleMenu)
		

        // this.editorContainer.appendChild(this.styleBar);

        this.validFocusElements.push(this.editorContainer)
	}
    tiptapSelectionUpdated(props: {editor: Editor}) {
        let editor = props.editor;
        if (editor != null && editor.isActive("link") && editor.isFocused) {
            let ranges = editor.state.selection.ranges;
            // console.log(editor.state.selection)
            let view = editor.view;
            const from = Math.min(...ranges.map(range => range.$from.pos))
            const to = Math.max(...ranges.map(range => range.$to.pos))
            //get selected node
            let node = view.nodeDOM(from) as HTMLElement;
            let nodePos = editor.$pos(from);
            let nodeEl = editor.$pos(nodePos.from).element;
            //get url of current selection
            let link = editor.getAttributes('link').href
            this.tiptapLinkBubbleMenuURL.value = link;
            computePosition(nodeEl, this.tiptapLinkBubbleMenu,{platform: platform, placement: "top-start", middleware: [offset(6)]}).then(
                ({x, y}) => {
                    Object.assign(this.tiptapLinkBubbleMenu.style, {
                        left: `${x}px`,
                        top: `${y}px`,
                    });
                    console.log(this.tiptapLinkBubbleMenu)
                }
            )
            this.tiptapLinkBubbleMenu.classList.remove("led-tooltip-hidden");
        } else {
            this.tiptapLinkBubbleMenu.classList.add("led-tooltip-hidden");
            
        }
    }
    render() {
        return `<div class="lpv-text">${this.content}</div>`;
    }
    save(): BlockSaveData<TextBlockSaveData> {
        return {
            type: "text",
            id: this.id,
            data: {
                content: this.content,
            },
            html_id: this.htmlId,
            classes: this.classes
        }
    }

    getSettingsModal() {
        return TextSettings
    }


}