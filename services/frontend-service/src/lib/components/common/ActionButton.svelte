<script lang="ts">
	type Variant = 'primary' | 'destructive';

	interface Props {
		text: string;
		variant?: Variant;
		onclick?: () => void;
		class?: string;
	}

	let { text, variant = 'primary', onclick, class: className = '' }: Props = $props();

	// Get variant-specific styling
	const variantStyles = $derived(() => {
		if (variant === 'destructive') {
			return {
				bg: 'bg-[#f36]',
				shadow: 'shadow-[0px_4px_15px_0px_rgba(255,51,102,0.25)]',
				hoverShadow: 'hover:shadow-[0px_6px_20px_0px_rgba(255,51,102,0.35)]'
			};
		}
		return {
			bg: 'bg-[#0f8]',
			shadow: 'shadow-[0px_4px_15px_0px_rgba(0,255,136,0.25)]',
			hoverShadow: 'hover:shadow-[0px_6px_20px_0px_rgba(0,255,136,0.35)]'
		};
	});
</script>

<button
	{onclick}
	class="w-52.5 h-13.5 {variantStyles().bg} text-black font-bold text-xs rounded-lg border border-black {variantStyles().shadow} {variantStyles().hoverShadow} transition-all hover:-translate-y-0.5 active:translate-y-0 {className}"
>
	{text}
</button>
