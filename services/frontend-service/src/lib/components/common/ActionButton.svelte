<script lang="ts">
	type Variant = 'primary' | 'destructive';

	interface Props {
		text: string;
		variant?: Variant;
		onclick?: () => void;
		class?: string;
	}

	let { text, variant = 'primary', onclick, class: className = '' }: Props = $props();

	const variantStyles = $derived(() => {
		if (variant === 'destructive') {
			return {
				bg: 'bg-[#f36]',
				text: 'text-[#7a0026]'
			};
		}
		return {
			bg: 'bg-[#0f8]',
			text: 'text-[#004d33]'
		};
	});
</script>

<button
	{onclick}
	class="w-52.5 h-13.5 {variantStyles().bg} {variantStyles().text} font-bold text-xs rounded-lg transition-all hover:-translate-y-0.5 active:translate-y-0 {className}"
>
	{text}
</button>
