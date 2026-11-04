<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// One letter (or "All") of an A–Z rail: a link with a 44 px tap target, or disabled text when no
// artist starts with it (no `to`).
const props = withDefaults(defineProps<{
  to?: RouteLocationRaw
  current?: boolean
}>(), {
  to: undefined,
  current: false
})
</script>

<template>
  <NuxtLink
    v-if="props.to"
    class="inline-flex min-h-11 min-w-7 shrink-0 items-center justify-center text-button text-archive-muted no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red current-page:font-medium current-page:text-archive-red compact:text-sm"
    :to="props.to"
    :aria-current="props.current ? 'page' : undefined"
  >
    <slot />
  </NuxtLink>
  <span v-else class="inline-flex min-h-11 min-w-7 shrink-0 cursor-not-allowed items-center justify-center text-button text-archive-muted opacity-28 compact:text-sm" aria-disabled="true"><slot /></span>
</template>
