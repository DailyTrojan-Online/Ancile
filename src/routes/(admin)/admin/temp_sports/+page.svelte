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
	]);

	let cnv: HTMLCanvasElement;

    let facilities: {id: number, facilityName: string, locationName: string, capacity: number, counts: number[], times: string[]}[] = $state.raw([]);

	onMount(async () => {
        let {data, error} = await supabase.from("sports_facility_data").select("*");
        processData(data)
	});

    function processData(data: any) {
        //data is listed 
        data.forEach((packet: any) => {
            packet.data.forEach((dat: any) => {
                let id = dat.LocationId;
                let idx = facilities.findIndex((d)=>{return d.id == id})
                if(idx == -1) {
                    facilities = [...facilities, {
                        id,
                        facilityName: dat.FacilityName,
                        locationName: dat.LocationName,
                        capacity: dat.TotalCapacity,
                        counts: [],
                        times: []
                    }]
                    idx = facilities.findIndex((d)=>{return d.id == id})
                }
                facilities[idx].counts = [...facilities[idx].counts, dat.LastCount]
                facilities[idx].times = [...facilities[idx].times, dat.LastUpdatedDateAndTime]
                
            });
        });

        console.log(facilities)
    }
</script>

{#each facilities as facility}
    <SportsGraphs data={facility}></SportsGraphs>
{/each}