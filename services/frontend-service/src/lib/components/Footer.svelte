<script lang=ts>
	import { modalStore } from '$lib/components/modal/modal';
</script>

<footer class="fixed bottom-0 left-0 right-0 z-20 py-6 text-center pointer-events-none">
	<p class="text-sm font-medium text-gray-500 pointer-events-auto">
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
