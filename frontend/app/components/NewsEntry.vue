<script setup lang="ts">
import { formatArchiveDate } from '~/utils/archiveDate'
import type { ResolvedNews } from '~/utils/resolveNews'

// One news article in a list. `compact`: date and title (start page). `row`: date and topic,
// title, summary and a small image (the /news/ overview).
const props = withDefaults(defineProps<{
  news: Pick<ResolvedNews, 'slug' | 'title' | 'date' | 'topic' | 'summary' | 'image' | 'image_alt'>
  layout?: 'compact' | 'row'
}>(), {
  layout: 'compact'
})

const { locale } = useI18n()
const localePath = useLocalePath()
const date = computed(() => formatArchiveDate(props.news.date, locale.value))
</script>

<template>
  <NuxtLink
    v-if="props.layout === 'compact'"
    class="[ news-entry ] group block py-4 text-archive-ink no-underline compact:py-3"
    :to="localePath(`/news/${props.news.slug}/`)"
  >
    <time class="m-0 mb-1.5 block text-xs tracking-widest text-archive-red uppercase compact:mb-1" :datetime="props.news.date">{{ date }}</time>
    <span class="block font-display text-xl leading-[1.18] transition-colors duration-150 group-hover:text-archive-red group-focus-visible:text-archive-red compact:text-lg compact:leading-[1.2]">{{ props.news.title }}</span>
  </NuxtLink>

  <NuxtLink
    v-else
    class="[ news-entry ] group grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-6 py-5 text-archive-ink no-underline compact:grid-cols-[minmax(0,1fr)_5.5rem] compact:gap-3 compact:py-3"
    :to="localePath(`/news/${props.news.slug}/`)"
  >
    <span class="min-w-0">
      <span class="m-0 mb-1.5 block text-xs tracking-widest text-archive-red uppercase"><time :datetime="props.news.date">{{ date }}</time> · {{ $t(`newsPage.topics.${props.news.topic}`) }}</span>
      <h3 class="m-0 font-display text-h4 leading-[1.18] font-normal transition-colors duration-150 group-hover:text-archive-red group-focus-visible:text-archive-red compact:text-lg">{{ props.news.title }}</h3>
      <span v-if="props.news.summary" class="mt-1.5 mb-0 block text-button text-archive-muted compact:text-sm">{{ props.news.summary }}</span>
    </span>
    <ArchiveImage v-if="props.news.image" class="aspect-4/3 w-full border border-archive-rule-warm/30 object-cover" :src="props.news.image" :alt="props.news.image_alt" sizes="(max-width: 767px) 92vw, 24vw" />
    <span v-else aria-hidden="true" />
  </NuxtLink>
</template>
