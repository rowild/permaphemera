<script setup lang="ts">
// The one close button of the site (modals, the footer drawer). Owner's rule, 2026-11-09, for
// ever: centred means centred. The × is a drawn icon (mask `svg-icon-close`) in the exact middle
// of the button (flex, both axes); the e2e test measures it. The parent sets size, colour and
// place through `class` (it lands on the button).
const props = withDefaults(defineProps<{
  label: string
  /** Size of the drawn × inside the button. */
  iconClass?: string
}>(), {
  iconClass: 'size-4'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<HTMLButtonElement | null>(null)
defineExpose({ focus: () => buttonRef.value?.focus() })
</script>

<template>
  <button
    ref="buttonRef"
    class="[ archive-close-button ] flex items-center justify-center border-0 bg-transparent p-0 leading-none"
    type="button"
    data-part="close"
    :aria-label="props.label"
    @click="emit('click', $event)"
  >
    <span class="svg-icon svg-icon-close block shrink-0 bg-current" :class="props.iconClass" aria-hidden="true" data-part="close-icon" />
  </button>
</template>
