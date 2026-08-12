<script setup lang="ts">
import { splitArtistCredit } from '~/utils/artistNames'
import { buildArtistDirectory } from '~/utils/artistDirectory'
import exhibitionsArtists from '~/data/exhibitions_artists.json'
import type { ExhibitionArtistLink } from '~/types/content'

const route = useRoute()
const router = useRouter()
const { artists, locationExhibitions } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']
// Change this one value to alter the size of every all-letters preview group.
const artistsPerLetterPreview = 5
const normalize = (value: string) => value.trim().toLocaleLowerCase()
const directoryArtists = computed(() =>
  buildArtistDirectory(artists.value, locationExhibitions.value, exhibitionsArtists as ExhibitionArtistLink[]))
const artistLedgerItems = computed(() => [
  { label: t('artists.ledgerArtists'), value: directoryArtists.value.length },
  { label: t('artists.linkedRecords'), value: directoryArtists.value.reduce((total, artist) => total + artist.records.length, 0) },
  { label: t('artists.index'), value: t('artists.surnameIndex') }
])
const availableLetters = computed(() => new Set(directoryArtists.value.map((artist) => artist.letter)))
const routeQuery = typeof route.query.q === 'string' ? route.query.q : ''
const routeLetter = typeof route.query.letter === 'string' && availableLetters.value.has(route.query.letter.toLocaleUpperCase())
  ? route.query.letter.toLocaleUpperCase()
  : ''
const artistSearchQuery = ref(routeQuery)
const selectedLetter = ref(routeLetter)
const openArtistSlug = ref('')

const filteredArtists = computed(() => {
  const queries = splitArtistCredit(artistSearchQuery.value).map(normalize)

  return directoryArtists.value.filter((artist) => {
    if (selectedLetter.value && artist.letter !== selectedLetter.value) return false
    if (!queries.length) return true

    const searchableValues = [
      artist.name,
      artist.displayName,
      artist.location,
      artist.years,
      ...artist.records.flatMap((record) => [record.title, record.venue, record.city])
    ].map(normalize)

    return queries.some((query) => searchableValues.some((value) => value.includes(query)))
  })
})

const artistsByLetter = computed(() => alphabet
  .map((letter) => {
    const matchingArtists = filteredArtists.value.filter((artist) => artist.letter === letter)
    const showCompleteLetter = selectedLetter.value === letter

    return {
      letter,
      artists: showCompleteLetter ? matchingArtists : matchingArtists.slice(0, artistsPerLetterPreview),
      total: matchingArtists.length,
      hasMore: !showCompleteLetter && matchingArtists.length > artistsPerLetterPreview
    }
  })
  .filter((group) => group.artists.length))

const visibleArtistCount = computed(() => artistsByLetter.value
  .reduce((total, group) => total + group.artists.length, 0))

const artistLetterRoute = (letter = '') => ({
  path: localePath('/artists/'),
  query: {
    ...(artistSearchQuery.value.trim() ? { q: artistSearchQuery.value.trim() } : {}),
    ...(letter ? { letter } : {})
  }
})

const toggleArtistDetails = (slug: string) => {
  openArtistSlug.value = openArtistSlug.value === slug ? '' : slug
}

const clearFilters = () => {
  artistSearchQuery.value = ''
  selectedLetter.value = ''
  openArtistSlug.value = ''
}

watch(() => route.query, (query) => {
  artistSearchQuery.value = typeof query.q === 'string' ? query.q : ''
  selectedLetter.value = typeof query.letter === 'string' && availableLetters.value.has(query.letter.toLocaleUpperCase())
    ? query.letter.toLocaleUpperCase()
    : ''
  openArtistSlug.value = ''
})

watch([artistSearchQuery, selectedLetter], ([query, letter]) => {
  const nextQuery = query.trim()
  const currentQuery = typeof route.query.q === 'string' ? route.query.q : ''
  const currentLetter = typeof route.query.letter === 'string' ? route.query.letter : ''
  if (currentQuery === nextQuery && currentLetter === letter) return

  void router.replace({
    path: localePath('/artists/'),
    query: {
      ...(nextQuery ? { q: nextQuery } : {}),
      ...(letter ? { letter } : {})
    }
  })
})

useSeoMeta({
  title: () => t('artists.seoTitle'),
  description: () => t('artists.seoDescription')
})
</script>

<template>
  <main class="[ site-shell ] [ artists-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="artists" />

    <div id="main-content">
      <section class="[ artists-page-intro ] [ section-band ] relative mx-auto grid min-h-120 max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] items-end gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:grid-cols-[minmax(0,1fr)_16rem] tablet:gap-8 compact:min-h-0 compact:grid-cols-1 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="artists-page-title">
        <div class="[ artists-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('artists.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('artists.eyebrow') }}</p>
          <h1 id="artists-page-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ $t('artists.title') }} <span class="text-archive-red">{{ $t('artists.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ $t('artists.intro') }}</p>
        </div>

        <ArchiveFactLedger class="[ artists-page-ledger ]" :items="artistLedgerItems" desktop-layout="stacked" />
      </section>

      <ArchiveInsetDivider class="compact:hidden" />

      <section id="artist-directory" class="[ artist-directory ] [ section-band ] relative py-[clamp(3rem,5vw,5rem)] compact:py-6" aria-labelledby="artist-directory-title">
        <div class="[ artist-directory-controls ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <div class="[ section-heading ] relative z-1 mb-8 compact:mb-4">
            <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('artists.directory') }}</p>
            <h2 id="artist-directory-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('artists.directoryTitle') }} <span class="text-archive-red">{{ $t('artists.directoryAccent') }}</span></h2>
          </div>

          <ArchiveSearchForm
            v-model="artistSearchQuery"
            class="[ artist-directory-search ]"
            id="artist-directory-search"
            :label="$t('artists.searchLabel')"
            :placeholder="$t('artists.searchPlaceholder')"
          />

          <ArchiveAlphabetRail class="[ artist-alphabet-filter ] mt-8 mb-0 gap-[clamp(0.55rem,1.2vw,1.35rem)] pb-[1.2rem] compact:mt-4 compact:gap-3 compact:pb-3" :label="$t('artists.alphabetAria')">
            <NuxtLink class="shrink-0 text-button text-archive-muted no-underline current-page:font-medium current-page:text-archive-red compact:text-sm" :to="artistLetterRoute()" :aria-current="!selectedLetter ? 'page' : undefined">{{ $t('common.all') }}</NuxtLink>
            <template v-for="letter in alphabet" :key="letter">
              <NuxtLink
              v-if="availableLetters.has(letter)"
                class="shrink-0 text-button text-archive-muted no-underline current-page:font-medium current-page:text-archive-red compact:text-sm"
                :to="artistLetterRoute(letter)"
                :aria-current="selectedLetter === letter ? 'page' : undefined"
              >
                {{ letter }}
              </NuxtLink>
              <span v-else class="shrink-0 cursor-not-allowed text-button text-archive-muted opacity-28 compact:text-sm" aria-disabled="true">{{ letter }}</span>
            </template>
          </ArchiveAlphabetRail>
        </div>

        <ArchiveInsetDivider />

        <div class="[ artist-directory-results ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-3">
          <div class="[ artist-directory-status ] mt-8 mb-8 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:mt-3 compact:mb-4 compact:min-h-0 compact:gap-2 compact:text-xs">
            <p class="m-0" role="status" aria-live="polite">{{ $t('artists.status', { visible: visibleArtistCount, total: filteredArtists.length, kind: $t(artistSearchQuery ? 'artists.kindMatching' : 'artists.kindAll') }) }}</p>
            <button v-if="artistSearchQuery || selectedLetter" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="clearFilters">{{ $t('artists.clearFilters') }}</button>
          </div>

          <div v-if="!artistsByLetter.length" class="[ artist-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
            <p class="m-0 text-title text-archive-ink">{{ $t('artists.noMatches') }}</p>
            <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="clearFilters">{{ $t('artists.returnAll') }}</button>
          </div>

          <div v-else class="[ artist-directory-columns ] archive-artist-column-rule columns-3 gap-10 tablet:columns-2 compact:columns-2 compact:gap-4">
            <ArtistDirectoryGroup
              v-for="group in artistsByLetter"
              :key="group.letter"
              :group="group"
              :open-artist-slug="openArtistSlug"
              :preview-limit="artistsPerLetterPreview"
              :show-more-to="artistLetterRoute(group.letter)"
              @toggle="toggleArtistDetails"
              @close="openArtistSlug = ''"
            />
          </div>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
