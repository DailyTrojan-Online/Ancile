
<script lang="ts">
	import type { NumericRange } from "@sveltejs/kit";
	import {
		CategoryScale,
		Chart,
		LinearScale,
		LineController,
		LineElement,
		PointElement,
		Colors,
		Legend
	} from "chart.js";
	import { onMount } from "svelte";
	let { data }: {data: {id: number, facilityName: string,datasets:{ label: string, data: number[]}[], times: string[]}} = $props();
	console.log(data.datasets)

	Chart.register([
		CategoryScale,
		LineController,
		LineElement,
		LinearScale,
		Colors,
		PointElement,
	]);

	let cnv: HTMLCanvasElement;
	onMount(async () => {
	let datas: any = [];
	data.datasets.forEach((dataset, i) => {
		datas.push({
		label: dataset.label,
		data: dataset.data,
		})
		console.log(dataset.data.length, data.times.length)
	})
		const chart = new Chart(
			cnv, // TypeScript needs "as any" here
			{
				type: "line",
				data: {
					labels: data.times,
					datasets: datas,
				},
				options: {
				  interaction: {
                    intersect: false,
                    mode: 'nearest',
                    axis: "x"
                  },
                  plugins: {
                    title: {
                      display: true,
                    },
                  }
				}
			}
		);
	});

</script>
<canvas bind:this={cnv}></canvas>
