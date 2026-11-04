<script setup lang="ts">
// THROWAWAY mockup (plans/2026-11-04__news-system.md §5.2). Never commit, never in production.
import { TOPIC_LABELS, formatNewsDate, useSampleNews } from '~/mockups/newsSample'

if (!import.meta.dev) throw createError({ statusCode: 404, fatal: true })

const route = useRoute()
const { locale } = useI18n()
const { news, linked } = useSampleNews()

const index = computed(() => Math.max(0, news.value.findIndex((item) => item.slug === route.query.slug)))
const article = computed(() => news.value[index.value]!)
const newer = computed(() => news.value[index.value - 1])
const older = computed(() => news.value[index.value + 1])
</script>

<template>
  <main class="[ site-shell ] [ news-article-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />
    <p class="m-0 bg-archive-red px-4 py-2 text-center text-xs tracking-widest text-archive-paper uppercase">Mockup · Beispieltext · Artikel /news/&lt;slug&gt;/</p>

    <article v-if="article" id="main-content" aria-labelledby="news-article-title">
      <header class="[ news-article-intro ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] compact:px-4 compact:pt-6 compact:pb-4">
        <ArchiveBreadcrumb>
          <ArchiveTextLink to="/">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><ArchiveTextLink to="/mockups/news-index">Aktuelles</ArchiveTextLink>
        </ArchiveBreadcrumb>
        <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ formatNewsDate(article.date, locale) }} · {{ TOPIC_LABELS[article.topic] }}</p>
        <h1 id="news-article-title" class="m-0 max-w-232 font-display text-h1-steep font-light leading-[0.98] compact:text-4xl compact:leading-[1.05]">{{ article.title }}</h1>
        <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ article.summary }}</p>
      </header>

      <div class="[ news-article-body ] [ section-band ] mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-[clamp(2rem,5vw,5rem)] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(2.5rem,4vw,4rem)] tablet:grid-cols-1 compact:px-4">
        <div class="grid max-w-3xl gap-5 text-lg leading-[1.65] text-archive-body compact:gap-4 compact:text-base compact:leading-normal">
          <p class="m-0">Beispieltext. Zwei Ausstellungsorte sind seit Anfang November im Archiv verzeichnet. Beide Seiten zeigen die Adresse, die Lage auf der Karte und die Ausstellungen, die dort zu sehen waren oder angekündigt sind.</p>
          <p class="m-0">Die erste Ausstellung, die als 360°-Rundgang aufgenommen wird, läuft bis Mitte Dezember. Der Rundgang ist ab dem letzten Ausstellungstag online.</p>
          <p class="m-0">Hinweise auf weitere Galerien und Ausstellungsorte kommen über das <ArchiveTextLink to="/contact/">Kontaktformular</ArchiveTextLink>.</p>
        </div>
        <img v-if="article.image" class="block aspect-[4/3] w-full border border-archive-rule-warm/30 object-cover" :src="article.image" alt="">
      </div>

      <section class="[ news-article-records ] [ section-band ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(3rem,5vw,5rem)] compact:px-4" aria-labelledby="news-article-records-title">
        <ArchiveInsetDivider class="mb-8" />
        <h2 id="news-article-records-title" class="m-0 mb-6 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">Im Artikel</h2>

        <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">Ausstellungen</h3>
        <div class="mb-10 grid grid-cols-2 gap-4 tablet:grid-cols-1">
          <ExhibitionCard v-for="exhibition in linked.exhibitions" :key="exhibition.id" :exhibition="exhibition" layout="side" />
        </div>

        <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">Galerien</h3>
        <div class="mb-10 grid grid-cols-4 gap-[1.4rem] tablet:grid-cols-2 compact:gap-3">
          <VenueArchiveCard v-for="venue in linked.venues" :key="venue.id" :venue="venue" />
        </div>

        <div class="grid grid-cols-3 gap-[clamp(2rem,4vw,4rem)] tablet:grid-cols-1">
          <section>
            <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">Personen</h3>
            <div>
              <PersonDirectoryEntry v-for="person in linked.persons" :key="person.id" :person="person" :roles="person.roles.map((role) => role.slug)" />
            </div>
          </section>
          <section>
            <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">Organisationen</h3>
            <div>
              <OrganisationDirectoryEntry v-for="organisation in linked.organisations" :key="organisation.id" :organisation="organisation" />
            </div>
          </section>
          <section v-if="linked.sponsors.length">
            <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">Sponsoren</h3>
            <div>
              <SponsorDirectoryEntry v-for="sponsor in linked.sponsors" :key="sponsor.id" :sponsor="sponsor" />
            </div>
          </section>
        </div>

        <nav class="[ news-article-pager ] mt-12 grid grid-cols-2 gap-6 compact:grid-cols-1 compact:gap-4" aria-label="Weitere Meldungen">
          <NuxtLink v-if="newer" class="group text-archive-ink no-underline" :to="`/mockups/news-article?slug=${newer.slug}`">
            <p class="m-0 mb-1 text-xs tracking-widest text-archive-muted uppercase">Neuere Meldung</p>
            <p class="m-0 font-display text-xl leading-[1.18] group-hover:text-archive-red">{{ newer.title }}</p>
          </NuxtLink>
          <span v-else />
          <NuxtLink v-if="older" class="group text-right text-archive-ink no-underline compact:text-left" :to="`/mockups/news-article?slug=${older.slug}`">
            <p class="m-0 mb-1 text-xs tracking-widest text-archive-muted uppercase">Ältere Meldung</p>
            <p class="m-0 font-display text-xl leading-[1.18] group-hover:text-archive-red">{{ older.title }}</p>
          </NuxtLink>
        </nav>
        <ArchiveTextLink class="mt-8" to="/mockups/news-index">
          Alle Meldungen
          <ArchiveArrow />
        </ArchiveTextLink>
      </section>
    </article>

    <ArchiveFooter />
  </main>
</template>
