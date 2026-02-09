import type { Component, Snippet } from "svelte";
import { genID } from "./util";

export let modals: (
	| {
			kind: "snippet";
			snippet: Snippet;
			position: "center" | "right";
			id: String;
	  }
	| {
			kind: "component";
			component: Component<any>;
			props?: Record<string, any>;
			position: "center" | "right";
			id: String;
	  }
)[] = $state([]);

export function openModal<P extends Record<string, any>>(
	content: Snippet | Component<any>,
	kind: "snippet" | "component",
	position: "center" | "right" = "center",
	props?: P
): string {
	let id = genID(4);
	if (kind == "snippet") {
		modals.push({ snippet: content as Snippet, kind, position, id });
	} else if (kind == "component") {
		modals.push({
			component: content as Component<P>,
			props,
			kind,
			position,
			id,
		});
	}
	console.log(modals);
	return id;
}

export function closeModalById(id: string) {
	let i = modals.findIndex((m) => m.id == id);
	if (i != -1) {
		modals.splice(i, 1);
	}
}

export function closeTopModal() {
	modals.pop();
}
