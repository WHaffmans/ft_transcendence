<script lang="ts">
	import { Chart } from '@flowbite-svelte-plugins/chart';
	import type { ApexOptions } from 'apexcharts';
	import type { RatingPoint } from '../../../routes/(app)/dashboard/+page.server';

	interface Props {
		ratingHistory: RatingPoint[];
	}

	let { ratingHistory }: Props = $props();

	const trend = $derived.by(() => {
		if (ratingHistory.length < 2) return 'neutral';
		const first = ratingHistory[0].rating;
		const last = ratingHistory[ratingHistory.length - 1].rating;
		return last >= first ? 'up' : 'down';
	});

	const seriesColor = $derived(trend === 'down' ? '#FF3366' : '#00FF88');

	const options: ApexOptions = $derived({
		chart: {
			height: 180,
			type: 'area',
			fontFamily: 'Inter, sans-serif',
			sparkline: { enabled: false },
			dropShadow: { enabled: false },
			toolbar: { show: false },
			background: 'transparent',
			animations: {
				enabled: true,
				easing: 'easeinout',
				speed: 600
			}
		},
		tooltip: {
			enabled: true,
			theme: 'dark',
			style: { fontFamily: 'Inter, sans-serif' },
			y: {
				formatter: (val: number) => val.toFixed(2)
			}
		},
		fill: {
			type: 'gradient',
			gradient: {
				opacityFrom: 0.4,
				opacityTo: 0,
				shade: seriesColor,
				gradientToColors: [seriesColor]
			}
		},
		dataLabels: { enabled: false },
		stroke: {
			width: 2,
			curve: 'smooth'
		},
		grid: {
			show: false,
			padding: { left: -8, right: -4, top: -10, bottom: -10 }
		},
		series: [
			{
				name: 'Rating',
				data: ratingHistory.map((p) => p.rating),
				color: seriesColor
			}
		],
		xaxis: {
			categories: ratingHistory.map((p) => p.date),
			labels: { show: false },
			axisBorder: { show: false },
			axisTicks: { show: false },
			crosshairs: { show: false }
		},
		yaxis: { show: false }
	});
</script>

{#if ratingHistory.length >= 2}
	<div class="w-full">
		<Chart {options} />
	</div>
{:else}
	<p class="text-center text-xs text-[#555]">Not enough matches for a trend</p>
{/if}
