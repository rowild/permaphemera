<script setup lang="ts">
// The hero of a record page (person, organisation, event): the breadcrumb across the top, then
// the record's copy (eyebrow, title, facts) in the first column and the aside (picture, about
// text) beside it, both starting level with the eyebrow (owner, 2026-11-04); one column on
// tablets. The page adds its own marker class (e.g. `[ person-hero ]`) and places the aside with
// its own row classes.
const props = defineProps<{
  titleId: string
}>()
</script>

<template>
  <section class="[ record-hero ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:pt-6 compact:pb-6" :aria-labelledby="props.titleId">
    <slot name="breadcrumb" />
    <div class="[ record-hero-grid ] grid grid-cols-[minmax(22rem,0.9fr)_minmax(24rem,1.1fr)] items-start gap-[clamp(3rem,7vw,7rem)] tablet:grid-cols-1 compact:gap-6">
      <div class="[ record-hero-copy ] relative z-2">
        <slot />
      </div>
      <slot name="aside" />
    </div>
  </section>
</template>
