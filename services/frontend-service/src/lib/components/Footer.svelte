<script lang=ts>
	import { modalStore } from '$lib/components/modal/modal';
	import Healthcheck from '$lib/components/app/Healthcheck.svelte';

</script>

<footer class="mt-auto text-center">
	<Healthcheck class="justify-center mt-1 mb-1" />
	<p class="text-sm font-medium text-gray-500 mb-1">
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
