<script setup lang="ts">
// THROWAWAY mockup (plans/2026-11-04__news-system.md §5.3). Never commit, never in production.
import { MAX_SCHEDULE_EXHIBITIONS_PER_GROUP, MAX_SCHEDULE_SLIDES_PER_GROUP, selectExhibitionSchedule } from '~/utils/exhibitionSchedule'
import { formatNewsDate, useSampleNews } from '~/mockups/newsSample'

if (!import.meta.dev) throw createError({ statusCode: 404, fatal: true })

const route = useRoute()
const { locale, t } = useI18n()
const { venueExhibitions } = useArchiveData()
const archiveToday = useArchiveToday()
const { news } = useSampleNews()

// ?split=third → 2/3 + 1/3 on desktop; default 3/4 + 1/4. Tablet is always 2/3 + 1/3.
const split = computed(() => route.query.split === 'third' ? 'third' : 'quarter')
const schedule = computed(() => selectExhibitionSchedule(venueExhibitions.value, archiveToday.value, MAX_SCHEDULE_SLIDES_PER_GROUP))
const groups = computed(() => [
  { id: 'current', label: t('landing.schedule.current'), items: schedule.value.current.slice(0, MAX_SCHEDULE_EXHIBITIONS_PER_GROUP), current: true },
  { id: 'upcoming', label: t('landing.schedule.upcoming'), items: schedule.value.upcoming.slice(0, MAX_SCHEDULE_EXHIBITIONS_PER_GROUP), current: false }
].filter((group) => group.items.length))
const latestNews = computed(() => news.value.slice(0, 5))
</script>

<template>
  <main class="[ site-shell ] archive-drafting-canvas relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />
    <p class="m-0 bg-archive-red px-4 py-2 text-center text-xs tracking-widest text-archive-paper uppercase">Mockup · Beispieltexte · Aufteilung {{ split === 'third' ? '2/3 + 1/3' : '3/4 + 1/4' }} (Tablet 2/3 + 1/3)</p>

    <section class="[ current-upcoming-section ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5">
      <header class="[ current-upcoming-heading ] mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-3 compact:mb-4">
        <div>
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('landing.schedule.eyebrow') }}</p>
          <h2 class="m-0 max-w-232 pb-1 font-display text-h2 font-normal leading-[1.08] compact:text-3xl">
            {{ $t('landing.schedule.titleBefore') }} <span class="text-archive-red">{{ $t('landing.schedule.titleAccent') }}</span> {{ $t('landing.schedule.titleAfter') }}
          </h2>
        </div>
        <ArchiveTextLink class="compact:hidden" to="/exhibitions/">
          {{ $t('landing.schedule.viewAll') }}
          <ArchiveArrow />
        </ArchiveTextLink>
      </header>

      <div
        class="[ current-upcoming-layout ] grid gap-[clamp(2rem,4vw,4rem)] tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] tablet:gap-8 compact:grid-cols-1"
        :class="split === 'third' ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,3fr)_minmax(0,1fr)]'"
      >
        <div class="[ schedule-groups ] grid gap-6 tablet:grid-cols-1 compact:hidden" :class="groups.length > 1 ? 'grid-cols-2' : 'grid-cols-1'">
          <section v-for="group in groups" :key="group.id" class="[ schedule-group ] min-w-0">
            <h3 class="m-0 mb-4 pl-1 text-left text-eyebrow font-medium tracking-widest uppercase" :class="group.current ? 'text-archive-red' : 'text-archive-copy'">{{ group.label }}</h3>
            <div class="grid gap-3">
              <ExhibitionCard v-for="exhibition in group.items" :key="exhibition.id" :exhibition="exhibition" layout="side" />
            </div>
          </section>
        </div>

        <div class="hidden compact:grid">
          <p class="m-0 text-sm text-archive-muted">(Mobile: hier bleiben die Slider der Ausstellungen wie heute.)</p>
        </div>

        <aside class="[ news-latest ] sticky top-32 min-w-0 self-start border-l border-archive-rule-brown/24 pl-[clamp(1.5rem,2.5vw,2.5rem)] compact:hidden" aria-labelledby="news-latest-title">
          <h3 id="news-latest-title" class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-copy uppercase">Aktuelles</h3>
          <ol class="m-0 list-none divide-y divide-archive-rule-warm/22 p-0">
            <li v-for="item in latestNews" :key="item.slug">
              <NuxtLink class="group block py-4 text-archive-ink no-underline" :to="`/mockups/news-article?slug=${item.slug}`">
                <p class="m-0 mb-1.5 text-xs tracking-widest text-archive-red uppercase">{{ formatNewsDate(item.date, locale) }}</p>
                <p class="m-0 font-display text-xl leading-[1.18] transition-colors duration-150 group-hover:text-archive-red">{{ item.title }}</p>
              </NuxtLink>
            </li>
          </ol>
          <ArchiveTextLink class="mt-5" to="/mockups/news-index">
            Alle Meldungen
            <ArchiveArrow />
          </ArchiveTextLink>
        </aside>
      </div>
      <ArchiveExhibitionsDivider />
    </section>

    <!-- Mobile only: the latest news as the last section before the sponsors. -->
    <section class="[ news-latest-mobile ] [ section-band ] hidden px-4 py-5 compact:block" aria-labelledby="news-latest-mobile-title">
      <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-2 inline-flex items-center gap-[0.7rem] font-display text-xs font-medium tracking-[0.06em] text-archive-red uppercase">Meldungen</p>
      <h2 id="news-latest-mobile-title" class="m-0 font-display text-3xl font-normal leading-[1.12]">Aktuelles</h2>
      <ol class="m-0 mt-4 list-none divide-y divide-archive-rule-warm/22 p-0">
        <li v-for="item in latestNews.slice(0, 3)" :key="item.slug">
          <NuxtLink class="block py-3 text-archive-ink no-underline" :to="`/mockups/news-article?slug=${item.slug}`">
            <p class="m-0 mb-1 text-xs tracking-widest text-archive-red uppercase">{{ formatNewsDate(item.date, locale) }}</p>
            <p class="m-0 font-display text-lg leading-[1.2]">{{ item.title }}</p>
          </NuxtLink>
        </li>
      </ol>
      <ArchiveTextLink class="mt-4" to="/mockups/news-index">
        Alle Meldungen
        <ArchiveArrow />
      </ArchiveTextLink>
    </section>

    <ArchiveFooter />
  </main>
</template>
