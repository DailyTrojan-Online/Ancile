<script lang="ts">
    import { onMount } from "svelte";
    import AsyncActionButton from "../AsyncActionButton.svelte";

    type Section = {
        title: string;
        id: number;
    };
    type SectionHierarchy = {
        mainSection: Section;
        subSections: Section[];
    };
    let { unsavedData = $bindable(false), supabase } = $props();
    let sections: SectionHierarchy[] = $state([]);

    let originalSections: SectionHierarchy[] = $state([]);
    let isModified = $derived(
        JSON.stringify(sections) !== JSON.stringify(originalSections),
    );
    $effect(() => {
        unsavedData = isModified;
    });
    
    async function saveSections() {
        console.log(sections);
        let { data: insData, error: insError } = await supabase
            .from("app_sections")
            .upsert({id: 1, data: sections});
        if (insError) {
            console.error(insError);
        }
        console.log("Sections saved:", sections);
        isModified = false;
    }

    async function loadSections() {
        let { data, error } = await supabase
            .from("app_sections")
            .select("*")
            .single();
        if (error) {
            console.error(error);
        }
        sections = data.data;
        originalSections = data.data;
    }

    onMount(() => {
        loadSections();
    });

    let selectedSection: Section | null = $state(null);
    let selectedParentIndex: number | null = $state(null);
    let selectedSubIndex: number | null = $state(null);
    let draggedItem: { parentIndex: number; subIndex: number | null } | null =
        $state(null);
    let nextId = 43;
    let isDragging = $state(false);
    let totalSections = $derived(
        sections.reduce((a, v) => {
            return a + v.subSections.length + 1;
        }, 0),
    );
    $inspect(totalSections);

    function selectSection(
        section: Section,
        parentIndex: number,
        subIndex: number | null = null,
    ) {
        selectedSection = section;
        selectedParentIndex = parentIndex;
        selectedSubIndex = subIndex;
    }

    function addMainSection() {
        const newSection: SectionHierarchy = {
            mainSection: { title: "New Section", id: nextId++ },
            subSections: [],
        };
        sections = [...sections, newSection];
    }

    function addSubSection() {
        if (selectedParentIndex !== null) {
            const newSubSection: Section = {
                title: "New Subsection",
                id: nextId++,
            };
            sections[selectedParentIndex].subSections = [
                ...sections[selectedParentIndex].subSections,
                newSubSection,
            ];
            sections = sections;
        }
    }

    function deleteSection() {
        if (selectedParentIndex === null) return;

        if (selectedSubIndex === null) {
            // Delete main section
            sections = sections.filter((_, i) => i !== selectedParentIndex);
            selectedSection = null;
            selectedParentIndex = null;
        } else {
            // Delete subsection
            sections[selectedParentIndex].subSections = sections[
                selectedParentIndex
            ].subSections.filter((_, i) => i !== selectedSubIndex);
            sections = sections;
            selectedSection = null;
            selectedSubIndex = null;
        }
    }

    function handleDragStart(
        parentIndex: number,
        subIndex: number | null = null,
    ) {
        draggedItem = { parentIndex, subIndex };
        isDragging = true;
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    let targetSubIndex: number | null = $state(null);
    let targetParentIndex: number = $state(0);
    let dropBelowTarget: boolean = $state(false);
    let isPastEnd: boolean = $state(false);

    function handleDrop() {
        if (!draggedItem) return;

        const { parentIndex: sourceParentIndex, subIndex: sourceSubIndex } =
            draggedItem;

        // Calculate actual drop position
        let actualTargetParent = targetParentIndex;
        let actualTargetSub = targetSubIndex;

        // If dragging a main section WITH children, it cannot become a child
        if (sourceSubIndex === null) {
            const hasChildren =
                sections[sourceParentIndex].subSections.length > 0;

            if (hasChildren) {
                // Main sections with children can only be dropped as main sections
                // Find which main section position we're at
                if (dropBelowTarget && actualTargetSub !== null) {
                    // Below a subsection means after the parent
                    actualTargetParent = actualTargetParent + 1;
                    actualTargetSub = null;
                } else if (!dropBelowTarget && actualTargetSub !== null) {
                    // Above a subsection means at the parent position
                    actualTargetSub = null;
                } else if (dropBelowTarget && actualTargetSub === null) {
                    // Below a main section
                    actualTargetParent = actualTargetParent + 1;
                }

                // Don't drop on itself
                if (sourceParentIndex === actualTargetParent) {
                    draggedItem = null;
                    isDragging = false;
                    return;
                }

                // Move the entire main section with all its children
                const [movedSection] = sections.splice(sourceParentIndex, 1);
                const insertIndex =
                    sourceParentIndex < actualTargetParent
                        ? actualTargetParent - 1
                        : actualTargetParent;
                sections.splice(insertIndex, 0, movedSection);
            } else {
                // Main section without children - can become a subsection
                const movedMainSection =
                    sections[sourceParentIndex].mainSection;

                if (actualTargetSub === null && !dropBelowTarget) {
                    // Above a main section - convert to main section before it
                    const [movedSection] = sections.splice(
                        sourceParentIndex,
                        1,
                    );
                    const insertIndex =
                        sourceParentIndex < actualTargetParent
                            ? actualTargetParent - 1
                            : actualTargetParent;
                    sections.splice(insertIndex, 0, movedSection);
                } else if (actualTargetSub === null && dropBelowTarget) {
                    // Below a main section
                    if (isPastEnd) {
                        // Past the end - add as new main section at the end
                        const [movedSection] = sections.splice(
                            sourceParentIndex,
                            1,
                        );
                        sections.push(movedSection);
                    } else {
                        // Below a main section - add as first child
                        sections.splice(sourceParentIndex, 1);
                        const adjustedTargetParent =
                            sourceParentIndex < actualTargetParent
                                ? actualTargetParent - 1
                                : actualTargetParent;
                        sections[adjustedTargetParent].subSections.unshift(
                            movedMainSection,
                        );
                    }
                } else {
                    // Dropping on a subsection
                    sections.splice(sourceParentIndex, 1);
                    const adjustedTargetParent =
                        sourceParentIndex < actualTargetParent
                            ? actualTargetParent - 1
                            : actualTargetParent;
                    let insertIndex = actualTargetSub!;
                    if (dropBelowTarget) insertIndex++;
                    sections[adjustedTargetParent].subSections.splice(
                        insertIndex,
                        0,
                        movedMainSection,
                    );
                }
            }
        } else {
            // Moving a subsection
            if (actualTargetSub === null && !dropBelowTarget) {
                // Above a main section - convert to main section before it
                const movedSubSection =
                    sections[sourceParentIndex].subSections[sourceSubIndex];
                sections[sourceParentIndex].subSections.splice(
                    sourceSubIndex,
                    1,
                );
                const newMainSection: SectionHierarchy = {
                    mainSection: movedSubSection,
                    subSections: [],
                };
                sections.splice(actualTargetParent, 0, newMainSection);
            } else if (actualTargetSub === null && dropBelowTarget) {
                // Below a main section - add as first child or convert to main
                const movedSubSection =
                    sections[sourceParentIndex].subSections[sourceSubIndex];
                sections[sourceParentIndex].subSections.splice(
                    sourceSubIndex,
                    1,
                );

                if (isPastEnd) {
                    // Past the end - convert to new main section at the end
                    const newMainSection: SectionHierarchy = {
                        mainSection: movedSubSection,
                        subSections: [],
                    };
                    sections.push(newMainSection);
                } else {
                    // Add as first subsection of target
                    sections[actualTargetParent].subSections.unshift(
                        movedSubSection,
                    );
                }
            } else {
                // Moving within subsections
                if (sourceParentIndex === actualTargetParent) {
                    // Same parent
                    if (sourceSubIndex === actualTargetSub) {
                        draggedItem = null;
                        isDragging = false;
                        return;
                    }

                    const subSections = sections[sourceParentIndex].subSections;
                    const [movedSubSection] = subSections.splice(
                        sourceSubIndex,
                        1,
                    );
                    let insertIndex = actualTargetSub;
                    if (dropBelowTarget) insertIndex++;
                    if (sourceSubIndex < insertIndex) insertIndex--;
                    subSections.splice(insertIndex, 0, movedSubSection);
                } else {
                    // Different parent
                    const movedSubSection =
                        sections[sourceParentIndex].subSections[sourceSubIndex];
                    sections[sourceParentIndex].subSections.splice(
                        sourceSubIndex,
                        1,
                    );
                    let insertIndex = actualTargetSub;
                    if (dropBelowTarget) insertIndex++;
                    sections[actualTargetParent].subSections.splice(
                        insertIndex,
                        0,
                        movedSubSection,
                    );
                }
            }
        }

        draggedItem = null;
        isDragging = false;
    }

    function updateTitle(newTitle: string) {
        if (selectedSection) {
            selectedSection.title = newTitle;
            sections = sections;
        }
    }

    function updateId(newId: number) {
        if (selectedSection) {
            selectedSection.id = newId;
            sections = sections;
        }
    }

    let layerList: HTMLElement | null = $state(null);
    let gap = 8;
    let itemHeight = 40;
    let dropPointY = $state(0);
    let dropPointLeft = $state(0);
    let dropPointRight = $state(8);
    let hoveredParentIndex: number | null = $state(null);
    let hoveredSubIndex: number | null = $state(null);

    function pointerMove(e: MouseEvent) {
        if (layerList == null || !isDragging) return;

        const rect = layerList.getBoundingClientRect();
        const relativeY = e.clientY + layerList.scrollTop - rect.top;

        // Check if dragging a main section with children
        const isDraggingMainWithChildren =
            draggedItem?.subIndex === null &&
            sections[draggedItem.parentIndex].subSections.length > 0;

        // Calculate which item we're hovering over
        let cumulativeY = 0;
        let found = false;

        for (let i = 0; i < sections.length; i++) {
            // Check main section
            if (
                relativeY >= cumulativeY &&
                relativeY < cumulativeY + itemHeight
            ) {
                hoveredParentIndex = i;
                hoveredSubIndex = null;
                dropBelowTarget = relativeY - cumulativeY > itemHeight / 2;
                found = true;
                break;
            }
            cumulativeY += itemHeight + gap;

            // Check subsections (skip if dragging main section with children)
            if (!isDraggingMainWithChildren) {
                for (let j = 0; j < sections[i].subSections.length; j++) {
                    if (
                        relativeY >= cumulativeY &&
                        relativeY < cumulativeY + itemHeight
                    ) {
                        hoveredParentIndex = i;
                        hoveredSubIndex = j;
                        dropBelowTarget =
                            relativeY - cumulativeY > itemHeight / 2;
                        found = true;
                        break;
                    }
                    cumulativeY += itemHeight + gap;
                }
            } else {
                // Skip over subsections for position calculation
                cumulativeY +=
                    sections[i].subSections.length * (itemHeight + gap);
            }
            if (found) break;
        }

        if (!found && relativeY >= cumulativeY) {
            // Below all items - should create a new main section at the end
            hoveredParentIndex = sections.length - 1;
            hoveredSubIndex = null;
            dropBelowTarget = true;
            isPastEnd = true;
        } else {
            isPastEnd = false;
        }

        // Calculate drop indicator position
        let dropPointIndex = 0;

        if (isPastEnd) {
            // Position after all items (all main sections and their subsections)
            dropPointIndex = totalSections;
        } else {
            for (let i = 0; i < (hoveredParentIndex ?? 0); i++) {
                dropPointIndex += sections[i].subSections.length + 1;
            }
            if (hoveredParentIndex !== null) {
                if (hoveredSubIndex !== null) {
                    dropPointIndex += hoveredSubIndex + 1;
                }
            }
            if (dropBelowTarget) {
                dropPointIndex++;
            }
        }

        dropPointY = dropPointIndex * (itemHeight + gap) + 2;

        // Adjust left/right position based on where we're dropping
        const isDraggingMain = draggedItem?.subIndex === null;
        const hasChildren = isDraggingMain
            ? sections[draggedItem.parentIndex].subSections.length > 0
            : false;

        const subIndent = 32; // 1.5rem + 8px padding

        if (isDraggingMain && hasChildren) {
            // Main sections with children always drop at full width (main section level)
            dropPointLeft = 8;
            dropPointRight = 8;
        } else if (isPastEnd) {
            // Past the end always shows full width
            dropPointLeft = 8;
            dropPointRight = 8;
        } else {
            // Subsections can drop as subsections or main sections
            if (
                hoveredSubIndex !== null ||
                (hoveredSubIndex === null && dropBelowTarget && !isPastEnd)
            ) {
                // Subsection level - indented
                dropPointLeft = subIndent;
                dropPointRight = 8;
            } else {
                // Main section level - full width
                dropPointLeft = 8;
                dropPointRight = 8;
            }
        }

        targetSubIndex = hoveredSubIndex;
        targetParentIndex = hoveredParentIndex ?? 0;
    }
</script>

<svelte:window
    ondragover={(e) => {
        e.preventDefault();
        pointerMove(e);
    }}
    ondrop={handleDrop}
/>
<!-- Layers Panel -->
<div
    class="admin-editor-column admin-editor-sidebar-inner admin-editor-column-noborder"
>
    <h2 class="h2-with-buttons">
        Sections
        <div class="flex-hor">
            {#if isModified}
                <AsyncActionButton action={saveSections}>Save</AsyncActionButton>
            {/if}
            <button
                class="admin-button button-icon"
                onclick={addMainSection}
                title="Add Main Section"
            >
                <i class="ti ti-plus"></i>
            </button>
        </div>
    </h2>

    <div class="layers-list" bind:this={layerList}>
    {#if sections.length == 0}
        <div class="admin-grid-loader">
            <i class="ti ti-loader-2"></i>
        </div>
        {/if}
        <div
            class="layer-item-dropper"
            class:active={isDragging}
            style:top={dropPointY + "px"}
            style:left={dropPointLeft + "px"}
            style:right={dropPointRight + "px"}
        ></div>

        {#each sections as hierarchy, parentIndex}
            <div class="layer-group">
                <!-- Main Section -->
                <div
                    class="layer-item main-layer"
                    class:selected={selectedSection === hierarchy.mainSection &&
                        selectedSubIndex === null}
                    class:dragging={isDragging &&
                        draggedItem?.parentIndex === parentIndex &&
                        draggedItem?.subIndex === null}
                    draggable="true"
                    ondragstart={(e) => {
                        handleDragStart(parentIndex);
                    }}
                    onclick={() =>
                        selectSection(hierarchy.mainSection, parentIndex)}
                >
                    <span class="layer-title"
                        >{hierarchy.mainSection.title}</span
                    >
                    <span class="admin-editor-input-label"
                        >{hierarchy.mainSection.id}</span
                    >
                </div>

                <!-- Subsections -->
                <div class="subsection-list">
                    {#each hierarchy.subSections as subSection, subIndex}
                        <div
                            class="layer-item sub-layer"
                            class:selected={selectedSection === subSection}
                            class:dragging={isDragging &&
                                draggedItem?.parentIndex === parentIndex &&
                                draggedItem?.subIndex === subIndex}
                            draggable="true"
                            ondragstart={(e) => {
                                handleDragStart(parentIndex, subIndex);
                            }}
                            onclick={() =>
                                selectSection(
                                    subSection,
                                    parentIndex,
                                    subIndex,
                                )}
                        >
                            <span class="layer-title">{subSection.title}</span>
                            <span class="admin-editor-input-label"
                                >{subSection.id}</span
                            >
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- Properties Panel -->
<div
    class="admin-editor-column admin-editor-fullwidth"
    style:gap="20px !important"
>
    <h2>{selectedSection ? "Edit Section" : "Section Properties"}</h2>

    {#if selectedSection}
        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">Title</div>
            <input
                id="section-title"
                type="text"
                class="admin-editor-input"
                bind:value={selectedSection.title}
                oninput={(e) => updateTitle(e.currentTarget.value)}
                placeholder="Section title"
            />
        </div>

        <div class="admin-editor-input-group">
            <div class="admin-editor-input-label">ID</div>
            <input
                id="section-id"
                type="number"
                class="admin-editor-input"
                bind:value={selectedSection.id}
                oninput={(e) => updateId(parseInt(e.currentTarget.value))}
                placeholder="Section ID"
            />
        </div>

        <div class="flex-hor">
            {#if selectedSubIndex === null && selectedParentIndex !== null}
                <button
                    class="admin-button button-primary"
                    onclick={addSubSection}
                >
                    Add Subsection
                </button>
            {/if}
            <button class="admin-button button-delete" onclick={deleteSection}>
                Delete
            </button>
        </div>
    {:else}
        <p>Select a section to edit its properties</p>
    {/if}
</div>

<style>
    .admin-editor-column {
        gap: 0px;
    }
    .layer-item-dropper {
        height: 4px;
        background: var(--accent);
        position: absolute;
        top: 0;
        border-radius: 5px;
        z-index: 999;
        opacity: 0;
        transition:
            opacity 0.1s,
            top 0.15s ease-out,
            left 0.15s ease-out,
            right 0.15s ease-out;
    }

    .layer-item-dropper.active {
        opacity: 1;
    }

    .layers-list {
        flex: 1;
        padding-top: 8px;
        padding-bottom: 100px;
        position: relative;
    }

    .layer-group {
        margin-bottom: 8px;
    }

    .layer-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        transition:
            border 0.2s,
            outline 0.1s;
        box-sizing: border-box;
        border: 1px solid var(--border);
        outline: 0px solid var(--accent);
        background: white;
        height: 40px;
    }

    .layer-item.selected {
        outline: 3px solid var(--accent);
        border-color: transparent;
    }

    .main-layer {
        margin-bottom: 8px;
        font-weight: 500;
    }

    .sub-layer {
        margin-left: 1.5rem;
        margin-bottom: 8px;
        font-size: 0.9rem;
        position: relative;
    }
    .sub-layer::after {
        position: absolute;
        width: 15px;
        height: 50px;
        content: "";
        left: -15px;
        top: -35px;
        z-index: -1;
        border: 3px solid #e0e0e0;
        border-top: none;
        border-right: none;
        border-bottom-left-radius: 6px;
    }

    .sub-layer.dragging::after {
        display: none;
    }

    .layer-item.dragging {
        opacity: 0.5;
    }

    .layer-title {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .layer-id {
        font-size: 0.75rem;
        opacity: 0.6;
        font-family: monospace;
    }

    .subsection-list {
        margin-top: 0.25rem;
    }
</style>
