import type { Component } from "svelte";
import Container from "$lib/components/RenderedPageBlocks/Container.svelte";
import Divider from "$lib/components/RenderedPageBlocks/Divider.svelte";
import Image from "$lib/components/RenderedPageBlocks/Image.svelte";
import Text from "$lib/components/RenderedPageBlocks/Text.svelte";
import DynamicPost from "$lib/components/RenderedPageBlocks/DynamicPost.svelte";
import type { BlockSaveData } from "./layout/lithograph";

export let componentMap: {
    [key: string]: Component<{blockData: BlockSaveData<any>, postBlockData?: any[], blockId: string}>;
} = {
    container: Container,
    divider: Divider,
    image: Image,
    text: Text,
    post: DynamicPost
};