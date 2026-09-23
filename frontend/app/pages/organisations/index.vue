<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { organisations } = useArchiveData()
const { t } = useI18n()
const localePath = useLocalePath()

const organisationSearchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const normalize = (value: string) => value.trim().toLocaleLowerCase()
const filteredOrganisations = computed(() => {
  const query = normalize(organisationSearchQuery.value)
  if (!query) return organisations.value

  return organisations.value.filter((organisation) => [
    organisation.title,
    organisation.short_title ?? '',
    t(`organisations.kinds.${organisation.kind}`, organisation.kind),
    organisation.city ?? '',
    organisation.address ?? '',
    organisation.lede ?? '',
    organisation.description ?? '',
    ...organisation.members.map((member) => member.name),
    ...organisation.records.map((record) => record.title)
  ].some((value) => normalize(value).includes(query)))
})
const ledgerItems = computed(() => [
  { label: t('organisations.ledgerOrganisations'), value: organisations.value.length },
  { label: t('organisations.ledgerMembers'), value: new Set(organisations.value.flatMap((organisation) => organisation.members.map((member) => member.id))).size },
  { label: t('organisations.ledgerRecords'), value: new Set(organisations.value.flatMap((organisation) => organisation.records.map((record) => record.id))).size }
])

watch(() => route.query.q, (query) => {
  organisationSearchQuery.value = typeof query === 'string' ? query : ''
})

watch(organisationSearchQuery, (query) => {
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
  description: () => t('organisations.seoDescription', { count: organisations.value.length })
})
</script>

<template>
  <main class="[ site-shell ] [ organisations-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="organisations" />

    <div id="main-content">
      <section class="[ organisations-page-intro ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)] items-end gap-[clamp(3rem,8vw,8rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:grid-cols-1 tablet:gap-8 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="organisations-page-title">
        <div class="[ organisations-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('organisations.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('organisations.eyebrow') }}</p>
          <h1 id="organisations-page-title" class="m-0 max-w-232 font-display text-hero font-light leading-[0.92] tablet:text-h1-steep compact:text-5xl compact:leading-none">{{ $t('organisations.title') }} <span class="text-archive-red">{{ $t('organisations.accent') }}</span></h1>
          <p class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ $t('organisations.intro') }}</p>
        </div>
        <ArchiveFactLedger :items="ledgerItems" />
      </section>

      <ArchiveInsetDivider class="compact:hidden" />

      <section id="organisation-directory" class="[ organisation-directory ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-6" aria-labelledby="organisation-directory-title">
        <div class="[ section-heading ] relative z-1 mb-4">
          <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('organisations.directoryEyebrow') }}</p>
          <h2 id="organisation-directory-title" class="m-0 max-w-232 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('organisations.directoryTitle', organisations.length) }} <span class="text-archive-red">{{ $t('organisations.directoryAccent') }}</span></h2>
          <p class="mt-[0.85rem] mb-0 max-w-216 text-button text-archive-muted compact:mt-2 compact:text-sm">{{ $t('organisations.directoryIntro') }}</p>
        </div>

        <ArchiveSearchForm
          v-model="organisationSearchQuery"
          class="[ organisation-directory-search ]"
          id="organisation-directory-search"
          :label="$t('organisations.searchLabel')"
          :placeholder="$t('organisations.searchPlaceholder')"
        />

        <div class="[ organisation-directory-status ] my-7 flex min-h-8 items-center justify-between gap-4 text-eyebrow text-archive-muted compact:my-4 compact:min-h-0 compact:gap-2 compact:text-xs">
          <p class="m-0" role="status" aria-live="polite">{{ $t('organisations.status', { visible: filteredOrganisations.length, total: organisations.length }) }}</p>
          <button v-if="organisationSearchQuery" class="border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="organisationSearchQuery = ''">{{ $t('organisations.clearSearch') }}</button>
        </div>

        <div v-if="!filteredOrganisations.length" class="[ organisation-directory-empty ] border-y border-archive-rule-deep/24 py-16 text-center">
          <p class="m-0 text-title text-archive-ink">{{ $t('organisations.noMatches') }}</p>
          <button class="mt-4 border-0 bg-transparent text-archive-red underline underline-offset-4" type="button" @click="organisationSearchQuery = ''">{{ $t('organisations.returnAll') }}</button>
        </div>

        <div v-else class="[ organisation-directory-list ] max-w-232 border-t border-archive-rule-warm/22">
          <OrganisationDirectoryEntry
            v-for="organisation in filteredOrganisations"
            :key="organisation.id"
            :organisation="organisation"
          />
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
