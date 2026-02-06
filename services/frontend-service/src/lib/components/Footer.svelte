<script lang=ts>
	import { modalStore } from '$lib/components/modal/modal';

	type TextSize = 'default' | 'card';

	interface Props {
		textSize?: TextSize; 
	}

	let {textSize = 'default'}: Props = $props();

	const textSizeClass = 
		textSize === 'default'
			? 'text-sm font-medium'
			: 'text-[10px] font-normal';
</script>

<footer class="absolute bottom-0 left-0 right-0 z-20 py-6 text-center">
	<p class={`${textSizeClass} text-gray-500`}>
		<button
			type="button"
			class="transition-colors hover:text-white"
			onclick={() => modalStore.open('privacy')}
		>
			Privacy Policy
		</button>

		<span class="mx-1">•</span>

		<button
			type="button"
			class="transition-colors hover:text-white"
			onclick={() => modalStore.open('terms')}
		>
			Terms of Service
		</button>
	</p>
</footer>
