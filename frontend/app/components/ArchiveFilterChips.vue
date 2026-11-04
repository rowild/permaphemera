<script setup lang="ts">
// A row of filter buttons with one choice at a time; the first button ("all") clears it.
// Used by /news/ (topics); built general so the exhibition tags can use it later.
const props = defineProps<{
  options: { value: string, label: string }[]
  allLabel: string
  label: string
}>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="[ filter-chips ] flex flex-wrap gap-2" role="group" :aria-label="props.label">
    <button
      v-for="option in [{ value: '', label: props.allLabel }, ...props.options]"
      :key="option.value || 'all'"
      class="border px-3.5 py-1.5 text-xs tracking-widest uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red"
      :class="model === option.value ? 'border-archive-red bg-archive-red text-archive-paper' : 'border-archive-rule-brown/40 bg-transparent text-archive-copy hover:text-archive-red'"
      type="button"
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
