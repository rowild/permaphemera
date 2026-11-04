<script setup lang="ts">
// The hero of the index pages (exhibitions, galleries, organisations, artists): one place, so the
// pages stay alike. The breadcrumb sits at the same height on every page; the text below it takes
// the room it needs, and the hero is at least 480px high on desktop and tablet.
const props = withDefaults(defineProps<{
  titleId: string
  breadcrumb: string
  eyebrow: string
  /** Replaces the eyebrow on mobile, where the ledger is hidden: "12 galleries · 4 states". */
  facts?: string
  title: string
  accent: string
  intro: string
  ledger: Array<{ label: string, value: string | number }>
  ledgerOnMobile?: boolean
}>(), {
  facts: undefined,
  ledgerOnMobile: false
})

const localePath = useLocalePath()
</script>

<template>
  <section class="[ directory-hero ] [ section-band ] relative mx-auto grid min-h-120 max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] items-start gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] tablet:grid-cols-[minmax(0,1fr)_16rem] tablet:gap-8 compact:min-h-0 compact:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-4" :aria-labelledby="props.titleId">
    <div class="[ directory-hero-heading ]">
      <ArchiveBreadcrumb>
        <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ props.breadcrumb }}</span>
      </ArchiveBreadcrumb>
      <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs" :class="{ 'archive-routed-eyebrow-facts': props.facts }">
        <template v-if="props.facts"><span class="compact:hidden">{{ props.eyebrow }}</span><span class="hidden compact:inline">{{ props.facts }}</span></template>
        <template v-else>{{ props.eyebrow }}</template>
      </p>
      <h1 :id="props.titleId" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ props.title }} <span class="text-archive-red">{{ props.accent }}</span></h1>
      <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ props.intro }}</p>
    </div>

    <ArchiveFactLedger class="[ directory-hero-ledger ] self-end" :class="{ 'compact:hidden': !props.ledgerOnMobile }" :items="props.ledger" desktop-layout="stacked" />
  </section>
</template>
