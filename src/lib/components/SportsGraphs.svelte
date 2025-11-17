
<script lang="ts">
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
	let { data }: {data: {id: number, facilityName: string, locationName: string, capacity: number, counts: number[], times: string[]}} = $props();


	Chart.register([
		CategoryScale,
		LineController,
		LineElement,
		LinearScale,
		PointElement,
	]);

	let cnv: HTMLCanvasElement;
	onMount(async () => {
		const chart = new Chart(
			cnv, // TypeScript needs "as any" here
			{
				type: "line",
				data: {
					labels: data.times,
					datasets: [
						{
							label: "# of Votes",
							data: data.counts,
							borderColor: "red",
						},
					],
				},
			}
		);
	});

</script>
<canvas bind:this={cnv}></canvas>
