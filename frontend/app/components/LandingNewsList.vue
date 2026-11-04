<script setup lang="ts">
import type { ResolvedNews } from '~/utils/resolveNews'

// The latest news articles on the start page. `column`: the right part of the row of current
// and upcoming exhibitions (desktop and tablet), stays in view while the cards scroll past.
// `section`: a section of its own (mobile, and the start page without a schedule row).
const props = withDefaults(defineProps<{
  news: ResolvedNews[]
  variant?: 'column' | 'section'
}>(), {
  variant: 'column'
})

const localePath = useLocalePath()
const headingId = computed(() => `news-latest-${props.variant}-title`)
</script>

<template>
  <aside
    v-if="props.variant === 'column'"
    class="[ news-latest ] sticky top-32 min-w-0 self-start border-l border-archive-rule-brown/24 pl-[clamp(1.5rem,2.5vw,2.5rem)]"
    :aria-labelledby="headingId"
  >
    <h3 :id="headingId" class="m-0 mb-1 pl-1 text-eyebrow font-medium tracking-widest text-archive-copy uppercase">{{ $t('newsPage.latest') }}</h3>
    <ol class="m-0 list-none divide-y divide-archive-rule-warm/22 p-0">
      <li v-for="item in props.news" :key="item.id"><NewsEntry :news="item" /></li>
    </ol>
    <ArchiveTextLink class="mt-4" :to="localePath('/news/')">
      {{ $t('newsPage.allNews') }}
      <ArchiveArrow />
    </ArchiveTextLink>
  </aside>

  <section
    v-else
    class="[ news-latest-section ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5"
    :aria-labelledby="headingId"
  >
    <ArchiveEyebrow ornament="section">{{ $t('newsPage.latestEyebrow') }}</ArchiveEyebrow>
    <h2 :id="headingId" class="m-0 font-display text-h2 font-normal leading-[0.98] compact:text-3xl compact:leading-[1.12]">{{ $t('newsPage.latest') }}</h2>
    <ol class="m-0 mt-4 max-w-232 list-none divide-y divide-archive-rule-warm/22 p-0">
      <li v-for="item in props.news" :key="item.id"><NewsEntry :news="item" /></li>
    </ol>
    <ArchiveTextLink class="mt-4" :to="localePath('/news/')">
      {{ $t('newsPage.allNews') }}
      <ArchiveArrow />
    </ArchiveTextLink>
  </section>
</template>
