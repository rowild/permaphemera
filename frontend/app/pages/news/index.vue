<script setup lang="ts">
import { NEWS_TOPICS } from '~/utils/resolveNews'

const { news } = useArchiveData()
const { t } = useI18n()
const activeTopic = ref('')

// A chip shows only when at least one article has that topic.
const topicOptions = computed(() => NEWS_TOPICS
  .filter((topic) => news.value.some((item) => item.topic === topic))
  .map((topic) => ({ value: topic, label: t(`newsPage.topics.${topic}`) })))
const filtered = computed(() => news.value.filter((item) => !activeTopic.value || item.topic === activeTopic.value))
const years = computed(() => {
  const byYear = new Map<string, typeof filtered.value>()
  for (const item of filtered.value) {
    const year = item.date.slice(0, 4)
    byYear.set(year, [...(byYear.get(year) ?? []), item])
  }
  return [...byYear.entries()].map(([year, items]) => ({ year, items }))
})

usePageSeo('/news/')
</script>

<template>
  <div class="[ news-page ]">

      <section class="[ news-page-intro ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] compact:px-4 compact:pt-6 compact:pb-4" aria-labelledby="news-page-title">
        <ArchiveBreadcrumb :items="[{ label: $t('newsPage.breadcrumb') }]" />
        <ArchiveEyebrow>{{ $t('newsPage.eyebrow') }}</ArchiveEyebrow>
        <ArchivePageTitle title-id="news-page-title" :title="$t('newsPage.title')" :intro="$t('newsPage.intro')" />
      </section>

      <section class="[ news-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('newsPage.listAria')">
        <div v-if="topicOptions.length > 1" class="[ news-topic-filter ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <ArchiveFilterChips v-model="activeTopic" :options="topicOptions" :all-label="$t('newsPage.all')" :label="$t('newsPage.filterAria')" />
        </div>

        <ArchiveInsetDivider class="mt-7 compact:mt-4" />

        <div class="[ news-years ] mx-auto grid max-w-[105rem] gap-[clamp(2.5rem,4vw,4rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-8 compact:px-4 compact:pt-4">
          <p v-if="!news.length" class="m-0 text-title text-archive-ink">{{ $t('newsPage.empty') }}</p>
          <section v-for="group in years" :key="group.year" :aria-labelledby="`news-year-${group.year}`">
            <h2 :id="`news-year-${group.year}`" class="m-0 mb-2 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ group.year }}</h2>
            <ol class="m-0 max-w-232 list-none divide-y divide-archive-rule-warm/22 p-0">
              <li v-for="item in group.items" :key="item.id"><NewsEntry :news="item" layout="row" /></li>
            </ol>
          </section>
        </div>
      </section>
  </div>
</template>
