<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  ariaLabel: string
  compactColumns?: boolean
}>(), {
  compactColumns: false
})
</script>

<template>
  <nav
    class="[ footer-navigation ] archive-footer-navigation grid content-start gap-3 compact:gap-2"
    :aria-label="ariaLabel"
  >
    <p class="m-0 mb-2 font-display text-archive-ochre uppercase compact:mb-1 compact:text-xs">{{ title }}</p>
    <div
      class="grid gap-3 *:relative *:w-fit *:font-display *:text-button *:text-archive-footer-copy/92 *:no-underline *:transition-colors *:duration-150 *:ease-out *:hover:text-archive-red compact:gap-2 compact:*:text-sm"
      :class="compactColumns ? 'compact:grid-cols-2' : ''"
    >
      <slot />
    </div>
  </nav>
</template>
