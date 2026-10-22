<script setup lang="ts">
// One icon action on an exhibition card (card rules §3.7): the 360° tour, a
// button with the Tour Editor icon, or the exhibition page, a link with the
// site icon. Both icons sit on the site's inset-corner frame. The tile shows
// 30 px; its ::before widens the hit area to 44 px.
//
// It reads as a control, not as a picture: it rests on the paper with a small
// shadow, and a fine red arrow runs out of its upper right corner cut. It keeps
// clear of the icon's ring: a ring with an arrow from its centre or its edge
// reads as the male symbol. On hover the tile lifts and the arrow grows a
// little from its start.
// Mouse hover and keyboard focus show `hint` in the site's framed tooltip (in
// <body>, so the card's clip cannot cut it). The accessible name stays
// `label`, which also names the exhibition.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  kind: 'tour' | 'page'
  label: string
  hint: string
  to?: string
  busy?: boolean
}>()

const NuxtLink = resolveComponent('NuxtLink')
const icons = {
  tour: '/media/svg/icons/tour-tile.svg',
  page: '/media/svg/icons/exhibition-tile.svg'
} as const

const anchor = ref<HTMLElement | null>(null)
const hintOpen = ref(false)
const showOnMouse = (event: PointerEvent) => { if (event.pointerType === 'mouse') hintOpen.value = true }
const showOnKeyboard = (event: FocusEvent) => { if ((event.target as HTMLElement).matches(':focus-visible')) hintOpen.value = true }
const hideHint = () => { hintOpen.value = false }
</script>

<template>
  <span
    ref="anchor"
    class="[ exhibition-action-tile-anchor ] relative inline-flex shrink-0"
    @pointerenter="showOnMouse"
    @pointerleave="hideHint"
    @focusin="showOnKeyboard"
    @focusout="hideHint"
  >
    <component
      :is="props.to ? NuxtLink : 'button'"
      v-bind="$attrs"
      class="[ exhibition-action-tile ] group/tile relative inline-flex size-7.5 cursor-pointer border-0 bg-transparent p-0 drop-shadow-tile transition-[filter,translate] duration-200 ease-out before:absolute before:-inset-1.75 hover:-translate-y-px hover:drop-shadow-tile-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red active:translate-y-px active:drop-shadow-none motion-reduce:transition-none"
      :to="props.to"
      :type="props.to ? undefined : 'button'"
      :aria-label="props.label"
      :aria-busy="props.busy || undefined"
      @click="hideHint"
    >
      <img class="block size-full" :src="icons[props.kind]" alt="" width="30" height="30">
      <!-- It starts in the corner cut, 15.5 px from the tile's centre (the ring ends at 10 px), and ends 6 px past the corner. -->
      <svg
        class="[ exhibition-action-tile-arrow ] pointer-events-none absolute -top-1.5 -right-1.5 size-3 origin-bottom-left text-archive-red transition-transform duration-200 ease-archive-lift group-hover/tile:scale-110 group-focus-visible/tile:scale-110 motion-reduce:transition-none"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M2 10 10 2M5.5 2H10V6.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </component>
    <ArchiveFloatingTooltip :anchor="anchor" :open="hintOpen" fit="content" prefer="above">{{ props.hint }}</ArchiveFloatingTooltip>
  </span>
</template>
