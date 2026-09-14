<script setup lang="ts">
import type { SponsorRecord } from '~/types/content'

defineProps<{
  sponsor: SponsorRecord
  divider?: boolean
}>()
</script>

<template>
  <div class="[ sponsor-mark ] flex h-34 flex-none basis-52 flex-col items-center justify-center gap-[0.7rem] px-4 py-[0.35rem] compact:h-24 compact:basis-36 compact:gap-2 compact:px-2">
    <img class="pointer-events-none block h-[4.6rem] w-22 object-contain" :src="`/media/images/landing/sponsors/${sponsor.id}.png`" alt="" aria-hidden="true" draggable="false" />
    <span class="block max-w-44 text-center font-display text-meta leading-[1.08] tracking-[0.055em] text-archive-ochre uppercase">{{ sponsor.title }}</span>
  </div>
  <span
    v-if="divider"
    class="[ sponsor-divider ] archive-sponsor-divider pointer-events-none block h-29 w-6 flex-none basis-6 bg-archive-ochre opacity-48"
    aria-hidden="true"
  />
</template>
