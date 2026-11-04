<script setup lang="ts">
import { splitArtistCredit } from '~/utils/artistNames'

const route = useRoute()
const { artistDirectory: directoryArtists } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#']
// Change this one value to alter the size of every all-letters preview group.
const artistsPerLetterPreview = 5
const artistLedgerItems = computed(() => [
  { label: t('artists.ledgerArtists'), value: directoryArtists.value.length },
  { label: t('artists.linkedRecords'), value: directoryArtists.value.reduce((total, artist) => total + artist.records.length, 0) },
  { label: t('artists.index'), value: t('artists.surnameIndex') }
])
const availableLetters = computed(() => new Set(directoryArtists.value.map((artist) => artist.letter)))
const artistSearchQuery = useQueryParam('q')
// A letter without artists (an old or mistyped link) shows all letters.
const selectedLetter = useQueryParam('letter', { validate: (letter) => (availableLetters.value.has(letter.toLocaleUpperCase()) ? letter.toLocaleUpperCase() : '') })
const openArtistSlug = ref('')

const filteredArtists = computed(() => {
  const queries = splitArtistCredit(artistSearchQuery.value).map(normalizeSearch)

  return directoryArtists.value.filter((artist) => {
    if (selectedLetter.value && artist.letter !== selectedLetter.value) return false
    if (!queries.length) return true

    const searchableValues = [
      artist.name,
      artist.displayName,
      artist.location,
      artist.years,
      ...artist.records.flatMap((record) => [record.title, record.venue, record.city])
    ].map(normalizeSearch)

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

// A new search or letter closes an open exhibition list.
watch(() => route.query, () => { openArtistSlug.value = '' })

usePageSeo('/artists/')
definePageMeta({ navActive: 'artists' })
</script>

<template>
  <div class="[ artists-page ]">

      <ArchiveDirectoryHero
        class="[ artists-page-intro ]"
        title-id="artists-page-title"
        :breadcrumb="$t('artists.breadcrumb')"
        :eyebrow="$t('artists.eyebrow')"
        :title="$t('artists.title')"
        :accent="$t('artists.accent')"
        :intro="$t('artists.intro')"
        :ledger="artistLedgerItems"
        ledger-on-mobile
      />

      <section id="artist-directory" class="[ artist-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('artists.directory')">
        <div class="[ artist-directory-controls ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <ArchiveSearchForm
            id="artist-directory-search"
            v-model="artistSearchQuery"
            class="[ artist-directory-search ]"
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
          <ArchiveDirectoryStatus class="[ artist-directory-status ] mt-8 mb-8 compact:mt-3 compact:mb-4" :text="$t('artists.status', { visible: visibleArtistCount, total: filteredArtists.length, kind: $t(artistSearchQuery ? 'artists.kindMatching' : 'artists.kindAll') })" :clear-label="artistSearchQuery || selectedLetter ? $t('artists.clearFilters') : undefined" @clear="clearFilters" />

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
</template>
