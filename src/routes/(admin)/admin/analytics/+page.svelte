<script lang="ts">
    import { onMount } from "svelte";
    import { Plot, BarX } from "svelteplot";

    let { data } = $props();

    type AnalyticEvent = {
        url: string;
        user_ip: string;
        user_agent: string;
        created_at: string;
        type: string;
        data: string;
    };
    type TimeRange = "all" | "1m" | "7d" | "1d" | "8h" | "1h" | "custom";
    let timeRanges: TimeRange[] = ["all", "1m", "7d", "1d", "8h", "1h"];
    let currentRange: TimeRange = $state("1m");
    let startDateRange: Date;
    let endDateRange: Date;

    let { session, supabase } = data;
    onMount(async () => {
        updateTimeRange("8h");
    });

    async function updateTimeRange(range: TimeRange) {
        currentRange = range;
        analytics = null;
        endDateRange = new Date();
        startDateRange = new Date();
        switch (range) {
            case "1m":
                startDateRange.setMonth(startDateRange.getMonth() - 1);
                break;
            case "7d":
                startDateRange.setDate(startDateRange.getDate() - 7);
                break;
            case "1d":
                startDateRange.setDate(startDateRange.getDate() - 1);
                break;
            case "8h":
                startDateRange.setHours(startDateRange.getHours() - 8);
                break;
            case "1h":
                startDateRange.setHours(startDateRange.getHours() - 1);
                break;
            case "all":
                startDateRange = new Date(0);
                break;
            default:
                break;
        }
        console.log(startDateRange, endDateRange);
        await refetchData()
    }

    let analytics: AnalyticEvent[] | null = $state(null);

    async function getAnalyticsWithRange(
        startDate: Date,
        endDate: Date,
    ): Promise<AnalyticEvent[]> {
        let analytics: AnalyticEvent[] = [];
        let i = 0;
        let increment = 100;
        while (true) {
            let { data, error } = await supabase
                .from("analytics")
                .select("*")
                .order("created_at")
                .range(i * increment, (i + 1) * increment - 1)
                .gte("created_at", startDate.toISOString())
                .lte("created_at", endDate.toISOString());
            if (error || !data || data.length == 0) {
                if (error) {
                    throw error;
                }
                break;
            }
            i++;
            console.log(data);
            analytics.push(...data);
            if (data.length < increment) {
                break;
            }
        }
        return analytics;
    }
    let filtersOpen = $state(false);
    type DataFilter = {"key": string; value: string; condition: "eq" | "neq"};
    let dataFilters: DataFilter[] = $state([]);
    let unsavedDataFilters: DataFilter[] = $state([]);
    let typeFilter = $state("");
    let unsavedTypeFilter = $state("")
    function openFilterPanel() {
      filtersOpen = true;
      unsavedDataFilters = [...dataFilters];
      unsavedTypeFilter = typeFilter;
    }

    function toggleFilterPanel() {
      if(filtersOpen) {
        filtersOpen = !filtersOpen;
      }else {
        openFilterPanel();
      }
    }
    async function refetchData() {
      analytics = await getAnalyticsWithRange(startDateRange, endDateRange);

    }

    async function updateFilters() {
      typeFilter = unsavedTypeFilter;
      await refetchData();
    }
</script>

<div class="admin-page-content">
    <div class="admin-page-header">
        <h1>Analytics</h1>
    </div>
    <div class="admin-editor">
        <div class="admin-editor-fullwidth">
            <div class="admin-editor-section">
                <div class="flex-hor">
                    {#each timeRanges as range}
                        <button
                            onclick={() => {
                                updateTimeRange(range);
                            }}
                            class="admin-grid-button button-sub"
                            class:active={range == currentRange}
                            >{range.toUpperCase()}</button
                        >
                    {/each}
                    <button
                        class="admin-grid-button button-sub button-float-right"
                        class:active={filtersOpen || dataFilters.length > 0}
                        onclick={toggleFilterPanel}
                        ><i class="ti ti-filter-2"></i>Filters {#if dataFilters.length > 0}({dataFilters.length}){/if}
                    </button>
                </div>
            </div>
            {#if analytics}
                <div class="admin-editor-section">
                    <div class="chart">
                        <Plot grid y={["A", "B", "C", "D"]}>
                            <BarX data={[1, 2, 3, 4]} />
                        </Plot>
                    </div>
                </div>
                <div class="admin-editor-section">
                    {analytics.length}
                </div>
            {:else}
                <i class="ti ti-loader-2 spin"></i>
            {/if}
        </div>
        <div class="admin-editor-column-collapser"
            class:admin-editor-column-open={filtersOpen}>
            <div
                class="admin-editor-column"
                class:admin-editor-column-open={filtersOpen}
            >
                <h2 class="h2-with-buttons">
                    Filters
                    <div class="button-group"><button onclick={updateFilters} class="admin-button">Apply</button>
                    </div>
                </h2>
                <div class="admin-editor-input-group">
                    <div class="admin-editor-input-label">Event Type</div>
                    <input type="text" bind:value={unsavedTypeFilter} class="admin-editor-input" />
                </div>
                {unsavedDataFilters.length}
            </div>
        </div>
    </div>
</div>

<style>
    .button-float-right {
        margin-left: auto;
    }

    .admin-editor-column-collapser {
        width: 0px;
        transition: 0.3s width;
    }
    .admin-editor-column {
        width: 300px;
        opacity: 0;
        visibility: hidden;
        box-sizing: border-box;
        transition: 0.3s;
        height: 100%;
        min-width: 0;
        overflow-y: auto;

    }
    .admin-editor-column-open .admin-editor-column {
        opacity: 1;
        visibility: visible;
    }
    .admin-editor-column-open {
        width:300px;
    }
</style>
