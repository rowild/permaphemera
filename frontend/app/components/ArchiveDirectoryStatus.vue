<script setup lang="ts">
// The line under a search ("5 von 22 …") with its clear button. A count shows once per page, so
// pages show the line only while a search or filter is active (`show`); the live region stays in
// place so the next result is still announced. The margin comes from the page (class) and stays
// while the line is empty: it is the space between the divider and the first heading below it.
const props = withDefaults(defineProps<{
  text: string
  show?: boolean
  /** Without it, no clear button (a page that keeps the line for its own reason). */
  clearLabel?: string
}>(), {
  show: true,
  clearLabel: undefined
})

const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div
    class="[ directory-status ]"
    :class="props.show ? 'flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:min-h-0 compact:gap-2 compact:text-xs' : ''"
  >
    <p class="m-0" role="status" aria-live="polite">{{ props.show ? props.text : '' }}</p>
    <button v-if="props.show && props.clearLabel" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="emit('clear')">{{ props.clearLabel }}</button>
  </div>
</template>
