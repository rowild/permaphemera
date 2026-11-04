<script setup lang="ts">
// The hero frame of the text pages: the heading (default slot) beside a figure (about, how it
// works; the figure first on tablets) or beside a fact box (contact, legal pages). The title and
// intro inside it are ArchivePageTitle (one scale for every page hero).
const props = defineProps<{
  titleId: string
  layout: 'figure' | 'aside'
}>()

const sectionClass = {
  figure: 'min-h-144 grid-cols-[minmax(0,0.88fr)_minmax(28rem,1.12fr)] tablet:gap-10',
  aside: 'min-h-128 grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] tablet:gap-8'
}
</script>

<template>
  <section
    class="[ editorial-hero ] [ section-band ] relative mx-auto grid max-w-band items-center gap-[clamp(3rem,7vw,7rem)] px-gutter py-[clamp(3rem,6vw,6rem)] tablet:min-h-0 tablet:grid-cols-1 compact:gap-6 compact:px-4 compact:py-4"
    :class="sectionClass[props.layout]"
    :aria-labelledby="props.titleId"
  >
    <header class="[ editorial-hero-heading ]" :class="{ 'tablet:row-start-2': props.layout === 'figure' }">
      <slot />
    </header>
    <slot name="aside" />
  </section>
</template>
