<script setup lang="ts">
// One icon action on an exhibition card (card rules §3.7): the 360° tour, a
// button with the Tour Editor icon, or the exhibition page, a link with the
// site icon. Both icons sit on the site's inset-corner frame. The tile shows
// 36 px; its ::before widens the hit area to 44 px.
const props = defineProps<{
  kind: 'tour' | 'page'
  label: string
  to?: string
  busy?: boolean
}>()

const NuxtLink = resolveComponent('NuxtLink')
const icons = {
  tour: '/media/svg/icons/tour-tile.svg',
  page: '/media/svg/icons/exhibition-tile.svg'
} as const
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'button'"
    class="[ exhibition-action-tile ] relative inline-flex size-9 shrink-0 cursor-pointer border-0 bg-transparent p-0 transition-[filter,translate] duration-200 ease-out before:absolute before:-inset-1 hover:-translate-y-px hover:brightness-104 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red active:translate-y-px motion-reduce:transition-none"
    :to="props.to"
    :type="props.to ? undefined : 'button'"
    :aria-label="props.label"
    :title="props.label"
    :aria-busy="props.busy || undefined"
  >
    <img class="block size-full" :src="icons[props.kind]" alt="" width="36" height="36">
  </component>
</template>
