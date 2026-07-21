<script lang="ts">
	let {
		min,
		max,
		guess,
		actual
	}: {
		min: number;
		max: number;
		guess: number;
		actual: number;
	} = $props();

	let guessPct = $derived((clamp(guess) - min) / (max - min) * 100);
	let actualPct = $derived((clamp(actual) - min) / (max - min) * 100);

	function clamp(v: number) {
		return Math.min(max, Math.max(min, v));
	}
</script>

<div class="w-full py-2">
	<div class="relative h-2 rounded-full bg-canvas-soft">
		<div
			class="absolute top-1/2 h-1 bg-ink/15"
			style={`left: ${Math.min(guessPct, actualPct)}%; width: ${Math.abs(actualPct - guessPct)}%; transform: translateY(-50%);`}
		></div>
		<div
			class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-canvas bg-terracotta shadow"
			style={`left: calc(${guessPct}% - 8px)`}
			title={`Your guess: ${guess}`}
		></div>
		<div
			class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-canvas bg-ultramarine shadow"
			style={`left: calc(${actualPct}% - 8px)`}
			title={`Actual: ${actual}`}
		></div>
	</div>
	<div class="mt-2 flex justify-center gap-6 text-xs text-ink-soft">
		<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-terracotta"></span> Your guess</span>
		<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-ultramarine"></span> Actual year</span>
	</div>
</div>
