<script lang="ts">
	let {
		value = $bindable(),
		min,
		max,
		disabled = false
	}: {
		value: number;
		min: number;
		max: number;
		disabled?: boolean;
	} = $props();

	let fillPct = $derived(((value - min) / (max - min)) * 100);
</script>

<div class="w-full">
	<div class="mb-3 text-center">
		<span class="font-display text-6xl font-semibold tabular-nums text-terracotta-dark sm:text-7xl">
			{value}
		</span>
	</div>
	<input
		class="year-slider"
		type="range"
		{min}
		{max}
		step="1"
		bind:value
		{disabled}
		style={`--fill: ${fillPct}%`}
		aria-label="Year guess"
	/>
	<div class="mt-1 flex justify-between text-xs text-ink-soft">
		<span>{min}</span>
		<span>{max}</span>
	</div>
</div>

<style>
	.text-terracotta-dark {
		color: var(--color-terracotta-dark);
	}
	:global(:root[data-theme='dark']) .text-terracotta-dark {
		color: var(--color-terracotta-soft);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .text-terracotta-dark {
			color: var(--color-terracotta-soft);
		}
	}
</style>
