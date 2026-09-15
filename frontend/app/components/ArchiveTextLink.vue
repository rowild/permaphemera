<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  to?: RouteLocationRaw
  href?: string
  target?: string
  rel?: string
  surface?: 'paper' | 'night'
  iconPosition?: 'start' | 'end'
  iconMotion?: 'none' | 'left' | 'external'
}>(), {
  to: undefined,
  href: undefined,
  target: undefined,
  rel: undefined,
  surface: 'paper',
  iconPosition: 'end',
  iconMotion: 'none'
})

const element = computed(() => props.to ? resolveComponent('NuxtLink') : 'a')

const surfaceClasses = {
  paper: 'text-archive-red',
  night: 'text-archive-light-ink'
} as const

const underlineClasses = {
  paper: 'after:bg-archive-red after:opacity-50 group-hover/archive-text-link:after:opacity-100 group-focus-visible/archive-text-link:after:opacity-100',
  night: 'after:bg-archive-light-ink after:opacity-70 group-hover/archive-text-link:after:bg-archive-red group-hover/archive-text-link:after:opacity-100 group-focus-visible/archive-text-link:after:bg-archive-red group-focus-visible/archive-text-link:after:opacity-100'
} as const

const iconMotionClasses = {
  none: '',
  left: 'group-hover/archive-text-link:-translate-x-1 group-focus-visible/archive-text-link:-translate-x-1',
  external: 'group-hover/archive-text-link:translate-x-0.5 group-hover/archive-text-link:-translate-y-0.5 group-focus-visible/archive-text-link:translate-x-0.5 group-focus-visible/archive-text-link:-translate-y-0.5'
} as const
</script>

<template>
  <component
    :is="element"
    class="[ archive-text-link ] group/archive-text-link relative inline-flex w-fit items-center gap-[0.45rem] font-display no-underline transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red"
    :class="surfaceClasses[props.surface]"
    :to="props.to"
    :href="props.href"
    :target="props.target"
    :rel="props.rel"
  >
    <span
      v-if="$slots.icon && props.iconPosition === 'start'"
      class="[ archive-text-link-icon ] inline-flex shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
      :class="iconMotionClasses[props.iconMotion]"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
    <span
      class="[ archive-text-link-label ] relative after:absolute after:right-0 after:bottom-[calc((1lh_-_1em)/2_-_0.14em)] after:left-0 after:h-px after:origin-center after:scale-x-90 after:content-[''] after:transition-[background-color,opacity,transform,translate,scale,rotate] after:duration-200 after:ease-out group-hover/archive-text-link:after:scale-x-100 group-focus-visible/archive-text-link:after:scale-x-100 motion-reduce:after:transition-none"
      :class="underlineClasses[props.surface]"
    >
      <slot />
    </span>
    <span
      v-if="$slots.icon && props.iconPosition === 'end'"
      class="[ archive-text-link-icon ] inline-flex shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
      :class="iconMotionClasses[props.iconMotion]"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
  </component>
</template>
