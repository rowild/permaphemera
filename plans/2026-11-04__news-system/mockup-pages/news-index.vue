<script setup lang="ts">
// THROWAWAY mockup (plans/2026-11-04__news-system.md §5.1). Never commit, never in production.
import { TOPIC_LABELS, formatNewsDate, useSampleNews, type NewsTopic } from '~/mockups/newsSample'

if (!import.meta.dev) throw createError({ statusCode: 404, fatal: true })

const { locale } = useI18n()
const { news } = useSampleNews()
const activeTopic = ref<NewsTopic | ''>('')

// A chip shows only when at least one article has that topic.
const topics = computed(() => (Object.keys(TOPIC_LABELS) as NewsTopic[]).filter((topic) => news.value.some((item) => item.topic === topic)))
const filtered = computed(() => news.value.filter((item) => !activeTopic.value || item.topic === activeTopic.value))
const years = computed(() => {
  const byYear = new Map<string, typeof filtered.value>()
  for (const item of filtered.value) byYear.set(item.date.slice(0, 4), [...(byYear.get(item.date.slice(0, 4)) ?? []), item])
  return [...byYear.entries()].map(([year, items]) => ({ year, items }))
})
</script>

<template>
  <main class="[ site-shell ] [ news-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />
    <p class="m-0 bg-archive-red px-4 py-2 text-center text-xs tracking-widest text-archive-paper uppercase">Mockup · Beispieltexte · Übersicht /news/</p>

    <div id="main-content">
      <section class="[ news-page-intro ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] compact:px-4 compact:pt-6 compact:pb-4" aria-labelledby="news-page-title">
        <ArchiveBreadcrumb>
          <ArchiveTextLink to="/">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>Aktuelles</span>
        </ArchiveBreadcrumb>
        <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">Meldungen</p>
        <h1 id="news-page-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">Aktuelles</h1>
        <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">Neue Galerien, Künstler:innen und Förderungen, Eröffnungen, Ausstellungen kurz vor dem 360°-Rundgang und Neues auf der Website.</p>
      </section>

      <section class="[ news-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" aria-label="Meldungen">
        <div class="[ news-topic-filter ] mx-auto flex max-w-[105rem] flex-wrap gap-2 px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4" role="group" aria-label="Nach Thema filtern">
          <button
            class="border px-3.5 py-1.5 text-xs tracking-widest uppercase transition-colors duration-150"
            :class="!activeTopic ? 'border-archive-red bg-archive-red text-archive-paper' : 'border-archive-rule-brown/40 bg-transparent text-archive-copy hover:text-archive-red'"
            type="button"
            :aria-pressed="!activeTopic"
            @click="activeTopic = ''"
          >
            Alle
          </button>
          <button
            v-for="topic in topics"
            :key="topic"
            class="border px-3.5 py-1.5 text-xs tracking-widest uppercase transition-colors duration-150"
            :class="activeTopic === topic ? 'border-archive-red bg-archive-red text-archive-paper' : 'border-archive-rule-brown/40 bg-transparent text-archive-copy hover:text-archive-red'"
            type="button"
            :aria-pressed="activeTopic === topic"
            @click="activeTopic = topic"
          >
            {{ TOPIC_LABELS[topic] }}
          </button>
        </div>

        <ArchiveInsetDivider class="mt-7 compact:mt-4" />

        <div class="[ news-years ] mx-auto grid max-w-[105rem] gap-[clamp(2.5rem,4vw,4rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-8 compact:px-4 compact:pt-4">
          <section v-for="group in years" :key="group.year" :aria-labelledby="`news-year-${group.year}`">
            <h2 :id="`news-year-${group.year}`" class="m-0 mb-4 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ group.year }}</h2>
            <ol class="m-0 max-w-232 list-none divide-y divide-archive-rule-warm/22 p-0">
              <li v-for="item in group.items" :key="item.slug">
                <NuxtLink class="group grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-6 py-5 text-archive-ink no-underline compact:grid-cols-[minmax(0,1fr)_5.5rem] compact:gap-3 compact:py-3" :to="`/mockups/news-article?slug=${item.slug}`">
                  <div class="min-w-0">
                    <p class="m-0 mb-1.5 text-xs tracking-widest text-archive-red uppercase">{{ formatNewsDate(item.date, locale) }} · {{ TOPIC_LABELS[item.topic] }}</p>
                    <h3 class="m-0 font-display text-h4 leading-[1.18] font-normal transition-colors duration-150 group-hover:text-archive-red compact:text-lg">{{ item.title }}</h3>
                    <p class="mt-1.5 mb-0 text-button text-archive-muted compact:text-sm">{{ item.summary }}</p>
                  </div>
                  <img v-if="item.image" class="aspect-[4/3] w-full border border-archive-rule-warm/30 object-cover" :src="item.image" alt="" loading="lazy">
                  <span v-else aria-hidden="true" />
                </NuxtLink>
              </li>
            </ol>
          </section>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
