<script setup lang="ts">
import { CURATOR_ROLES, ORGANISER_ROLES, isRegisterOrganisation, personsInRoles } from '~/utils/organisationsRegister'
import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'
import type { ResolvedPerson } from '~/utils/resolvePersons'
import type { ResolvedSponsor } from '~/utils/resolveSponsors'

const route = useRoute()
const router = useRouter()
const { organisations, persons, sponsorPages } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

// Who organises: the organisations that run a gallery, stand behind an exhibition or are a
// group; the people who organise (board members included) and who curate; the sponsors.
const registerOrganisations = computed(() => organisations.value.filter(isRegisterOrganisation))
const organisers = computed(() => personsInRoles(persons.value, ORGANISER_ROLES))
const curators = computed(() => personsInRoles(persons.value, CURATOR_ROLES))
const peopleCount = computed(() => new Set([...organisers.value, ...curators.value].map((person) => person.id)).size)

const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const normalize = (value: string) => value.trim().toLocaleLowerCase()
const matches = (values: (string | undefined)[]) => {
  const query = normalize(searchQuery.value)
  return !query || values.some((value) => value && normalize(value).includes(query))
}
const organisationText = (organisation: ResolvedOrganisation) => [
  organisation.title,
  organisation.short_title,
  t(`organisations.kinds.${organisation.kind}`, organisation.kind),
  organisation.city,
  organisation.address,
  organisation.lede,
  organisation.description,
  ...organisation.members.map((member) => member.name),
  ...organisation.records.map((record) => record.title)
]
const personText = (person: ResolvedPerson) => [
  person.name,
  person.basedIn,
  person.lede,
  ...person.roles.map((role) => role.title),
  ...person.memberships.map((membership) => membership.title),
  ...person.records.map((record) => record.exhibition.title)
]
const sponsorText = (sponsor: ResolvedSponsor) => [
  sponsor.title,
  sponsor.description,
  ...sponsor.exhibitions.map((exhibition) => exhibition.title),
  ...sponsor.venues.map((venue) => venue.name),
  ...sponsor.persons.map((person) => person.name),
  ...sponsor.towns
]

const filteredOrganisations = computed(() => registerOrganisations.value.filter((organisation) => matches(organisationText(organisation))))
const filteredOrganisers = computed(() => organisers.value.filter((person) => matches(personText(person))))
const filteredCurators = computed(() => curators.value.filter((person) => matches(personText(person))))
const filteredSponsors = computed(() => sponsorPages.value.filter((sponsor) => matches(sponsorText(sponsor))))
const totalEntries = computed(() => registerOrganisations.value.length + organisers.value.length + curators.value.length + sponsorPages.value.length)
const visibleEntries = computed(() => filteredOrganisations.value.length + filteredOrganisers.value.length + filteredCurators.value.length + filteredSponsors.value.length)

const recordCount = computed(() => new Set(registerOrganisations.value.flatMap((organisation) => organisation.records.map((record) => record.id))).size)
const ledgerItems = computed(() => [
  { label: t('organisations.ledgerOrganisations'), value: registerOrganisations.value.length },
  { label: t('organisations.ledgerPeople'), value: peopleCount.value },
  { label: t('organisations.ledgerRecords'), value: recordCount.value }
])
// Mobile: the ledger's three facts as one line in the eyebrow's place.
const organisationFacts = computed(() => [
  t('organisations.factOrganisations', registerOrganisations.value.length),
  t('organisations.factPeople', peopleCount.value),
  t('organisations.factRecords', recordCount.value)
].map((fact) => fact.replaceAll(' ', ' ')).join(' · '))

watch(() => route.query.q, (query) => {
  searchQuery.value = typeof query === 'string' ? query : ''
})

watch(searchQuery, (query) => {
  const nextQuery = query.trim()
  const currentQuery = typeof route.query.q === 'string' ? route.query.q : ''
  if (nextQuery === currentQuery) return

  void router.replace({
    path: localePath('/organisations/'),
    query: nextQuery ? { q: nextQuery } : {}
  })
})

useSeoMeta({
  title: () => t('organisations.seoTitle'),
  description: () => t('organisations.seoDescription', { count: registerOrganisations.value.length })
})
</script>

<template>
  <main class="[ site-shell ] [ organisations-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="organisations" />

    <div id="main-content">
      <section class="[ organisations-page-intro ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_18rem] items-end gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] tablet:grid-cols-[minmax(0,1fr)_16rem] tablet:gap-8 compact:grid-cols-1 compact:gap-6 compact:px-4 compact:pt-6 compact:pb-4" aria-labelledby="organisations-page-title">
        <div class="[ organisations-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('organisations.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow archive-routed-eyebrow-facts m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs"><span class="compact:hidden">{{ $t('organisations.eyebrow') }}</span><span class="hidden compact:inline">{{ organisationFacts }}</span></p>
          <h1 id="organisations-page-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ $t('organisations.title') }} <span class="text-archive-red">{{ $t('organisations.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ $t('organisations.intro') }}</p>
        </div>

        <ArchiveFactLedger class="[ organisations-page-ledger ] compact:hidden" :items="ledgerItems" desktop-layout="stacked" />
      </section>

      <section id="organisation-directory" class="[ organisation-directory ] [ section-band ] relative pb-[clamp(3rem,5vw,5rem)] compact:pb-6" :aria-label="$t('organisations.directory')">
        <div class="[ organisation-directory-controls ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <ArchiveSearchForm
            v-model="searchQuery"
            class="[ organisation-directory-search ]"
            id="organisation-directory-search"
            :label="$t('organisations.searchLabel')"
            :placeholder="$t('organisations.searchPlaceholder')"
          />
        </div>

        <ArchiveInsetDivider class="mt-7 compact:mt-4" />

        <div class="[ organisation-directory-results ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4">
          <div class="[ organisation-directory-status ] my-7 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:my-4 compact:min-h-0 compact:gap-2 compact:text-xs">
            <p class="m-0" role="status" aria-live="polite">{{ $t('organisations.status', { visible: visibleEntries, total: totalEntries }) }}</p>
            <button v-if="searchQuery" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="searchQuery = ''">{{ $t('organisations.clearSearch') }}</button>
          </div>

          <div v-if="!visibleEntries" class="[ organisation-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
            <p class="m-0 text-title text-archive-ink">{{ $t('organisations.noMatches') }}</p>
            <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="searchQuery = ''">{{ $t('organisations.returnAll') }}</button>
          </div>

          <div v-else class="[ organisation-directory-blocks ] grid gap-[clamp(3rem,5vw,5rem)]">
            <section v-if="filteredOrganisations.length" class="[ organisation-list ]" aria-labelledby="organisation-list-title">
              <div class="[ section-heading ] relative z-1 mb-4">
                <h2 id="organisation-list-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('organisations.listTitle') }} <span class="text-archive-red">{{ filteredOrganisations.length }}</span></h2>
                <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.listIntro') }}</p>
              </div>
              <div class="[ organisation-directory-list ] max-w-232 border-t border-archive-rule-warm/22">
                <OrganisationDirectoryEntry
                  v-for="organisation in filteredOrganisations"
                  :key="organisation.id"
                  :organisation="organisation"
                />
              </div>
            </section>

            <section v-if="filteredOrganisers.length || filteredCurators.length" class="[ people-list ]" aria-labelledby="people-list-title">
              <div class="[ section-heading ] relative z-1 mb-4">
                <h2 id="people-list-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('organisations.peopleTitle') }} <span class="text-archive-red">{{ filteredOrganisers.length + filteredCurators.length }}</span></h2>
                <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.peopleIntro') }}</p>
              </div>
              <div class="[ people-list-groups ] grid grid-cols-2 items-start gap-[clamp(2rem,5vw,5rem)] tablet:grid-cols-1">
                <div v-if="filteredOrganisers.length" class="[ people-list-group ]">
                  <h3 class="m-0 mb-3 font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:text-xs">{{ $t('organisations.organisersTitle') }} · {{ filteredOrganisers.length }}</h3>
                  <div class="border-t border-archive-rule-warm/22">
                    <PersonDirectoryEntry v-for="person in filteredOrganisers" :key="person.id" :person="person" :roles="ORGANISER_ROLES" />
                  </div>
                </div>
                <div v-if="filteredCurators.length" class="[ people-list-group ]">
                  <h3 class="m-0 mb-3 font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:text-xs">{{ $t('organisations.curatorsTitle') }} · {{ filteredCurators.length }}</h3>
                  <div class="border-t border-archive-rule-warm/22">
                    <PersonDirectoryEntry v-for="person in filteredCurators" :key="person.id" :person="person" :roles="CURATOR_ROLES" />
                  </div>
                </div>
              </div>
            </section>

            <section v-if="filteredSponsors.length" class="[ sponsor-list ]" aria-labelledby="sponsor-list-title">
              <div class="[ section-heading ] relative z-1 mb-4">
                <h2 id="sponsor-list-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('organisations.sponsorsTitle') }} <span class="text-archive-red">{{ filteredSponsors.length }}</span></h2>
                <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.sponsorsIntro') }}</p>
              </div>
              <div class="[ sponsor-directory-list ] max-w-232 border-t border-archive-rule-warm/22">
                <SponsorDirectoryEntry v-for="sponsor in filteredSponsors" :key="sponsor.id" :sponsor="sponsor" />
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
