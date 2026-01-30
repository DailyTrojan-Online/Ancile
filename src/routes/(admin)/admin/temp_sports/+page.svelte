<script lang="ts">
    import SportsGraphs from "$lib/components/SportsGraphs.svelte";
    import type { NumericRange } from "@sveltejs/kit";
    import {
        CategoryScale,
        Chart,
        LinearScale,
        LineController,
        LineElement,
        PointElement,
        Tooltip,
        Legend,
    } from "chart.js";
    import { onMount } from "svelte";
    let { data } = $props();

    let { session, supabase } = data;

    Chart.register([
        CategoryScale,
        LineController,
        LineElement,
        LinearScale,
        PointElement,
        Tooltip,
        Legend,
    ]);

    let cnv: HTMLCanvasElement;

    let facilities: {
        id: number;
        facilityName: string;
        datasets: { label: string; id: number; data: number[], closed: number[], lastUpdated: number[] }[];
        times: string[];
    }[] = $state.raw([]);

    onMount(async () => {
        let d: any = [];
        for (let i = 0; i < 4; i++) {
            let { data, error } = await supabase
                .from("sports_facility_data")
                .select("*")
                .range(i * 1000, (i + 1) * 1000);
            console.log(data);
            if (data) {
                d = [...d, ...data];
            }
        }
        console.log(d);

        processData(d);
    });
    let times: string[] = [];

    function processData(data: any) {
        //data is listed
        data.forEach((packet: any, i: any) => {
            let date = new Date(packet.created_at).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
            times.push(date);

                packet.data.forEach((dat: any) => {
                    let id = dat.FacilityId;
                    let idx = facilities.findIndex((d) => {
                        return d.id == id;
                    });
                    if (idx == -1) {
                        facilities = [
                            ...facilities,
                            {
                                id,
                                facilityName: dat.FacilityName,
                                datasets: [],
                                times: [],
                            },
                        ];
                        idx = facilities.findIndex((d) => {
                            return d.id == id;
                        });
                    }
                    let Lid = dat.LocationId;
                    let idx2 = facilities[idx].datasets.findIndex((d) => {
                        return d.id == Lid;
                    });
                    if (idx2 == -1) {
                        facilities[idx].datasets = [
                            ...facilities[idx].datasets,
                            {
                                label: dat.LocationName,
                                id: Lid,
                                data: [],
                                closed: [],
                                lastUpdated: [],
                            },
                        ];
                        idx2 = facilities[idx].datasets.findIndex((d) => {
                            return d.id == Lid;
                        });
                    }
                    facilities[idx].datasets[idx2].data = [
                        ...facilities[idx].datasets[idx2].data,
                        dat.LastCount,
                    ];
                    facilities[idx].datasets[idx2].closed = [
                        ...facilities[idx].datasets[idx2].closed,
                        dat.IsClosed,
                    ];
                    facilities[idx].datasets[idx2].lastUpdated = [
                        ...facilities[idx].datasets[idx2].lastUpdated,
                        dat.LastUpdatedDateAndTime,
                    ];
                    // facilities[idx].times = [...facilities[idx].times, dat.LastUpdatedDateAndTime]
                });
        });

        for (let i = 0; i < facilities.length; i++) {
            facilities[i].times = [...times];
        }
        console.log(facilities)
    }
</script>

{#each facilities as facility}
    {facility.facilityName}
    <SportsGraphs data={facility}></SportsGraphs>
{/each}
