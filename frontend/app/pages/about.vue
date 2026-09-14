<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

interface EditorialSection {
  id: string
  eyebrow: string
  title: string
  accent: string
  paragraphs: string[]
  emphasizedTerms?: string[]
}

const editorialSections = computed<EditorialSection[]>(() => [
  {
    id: 'spatial-memory',
    eyebrow: t('about.sections.spatialMemory.eyebrow'),
    title: t('about.sections.spatialMemory.title'),
    accent: t('about.sections.spatialMemory.accent'),
    paragraphs: [t('about.body.p1'), t('about.body.p2'), t('about.body.p3')]
  },
  {
    id: 'invitation',
    eyebrow: t('about.sections.invitation.eyebrow'),
    title: t('about.sections.invitation.title'),
    accent: t('about.sections.invitation.accent'),
    paragraphs: [t('about.body.p4')]
  },
  {
    id: 'visibility',
    eyebrow: t('about.sections.visibility.eyebrow'),
    title: t('about.sections.visibility.title'),
    accent: t('about.sections.visibility.accent'),
    paragraphs: [t('about.body.p5')]
  },
  {
    id: 'index',
    eyebrow: t('about.sections.index.eyebrow'),
    title: t('about.sections.index.title'),
    accent: t('about.sections.index.accent'),
    paragraphs: [t('about.body.p6'), t('about.body.p7')]
  },
  {
    id: 'beginnings',
    eyebrow: t('about.sections.beginnings.eyebrow'),
    title: t('about.sections.beginnings.title'),
    accent: t('about.sections.beginnings.accent'),
    paragraphs: [t('about.body.p8'), t('about.body.p9')]
  },
  {
    id: 'parkschloessl-origin',
    eyebrow: t('about.sections.parkschloesslOrigin.eyebrow'),
    title: t('about.sections.parkschloesslOrigin.title'),
    accent: t('about.sections.parkschloesslOrigin.accent'),
    paragraphs: [t('about.body.p10')],
    emphasizedTerms: ['Adi Schmölzer', 'Monika Gaberscek']
  }
])

useSeoMeta({
  title: () => t('about.seoTitle'),
  description: () => t('about.seoDescription')
})
</script>

<template>
  <main class="[ site-shell ] [ about-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader active="about" />

    <div id="main-content">
      <section class="[ about-page-intro ] [ section-band ] relative mx-auto grid min-h-144 max-w-[105rem] grid-cols-[minmax(0,0.88fr)_minmax(28rem,1.12fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:min-h-0 tablet:grid-cols-1 tablet:gap-10 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="about-page-title">
        <div class="[ about-page-heading ] tablet:row-start-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('about.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">
            {{ $t('about.eyebrow') }}
          </p>
          <h1 id="about-page-title" class="m-0 max-w-216 pb-2 font-display text-hero font-light leading-[0.98] tablet:text-h1-steep compact:pb-1 compact:text-5xl compact:leading-[1.04]">
            {{ $t('about.title') }} <span class="text-archive-red">{{ $t('about.accent') }}</span>
          </h1>
          <p class="mt-5 mb-0 max-w-152 text-lg leading-relaxed text-archive-body compact:mt-4 compact:text-base">
            {{ $t('about.intro') }}
          </p>
        </div>

        <figure class="[ about-page-figure ] relative m-0 tablet:row-start-1">
          <img
            class="block h-auto w-full object-contain filter-[drop-shadow(0_1.15rem_1.25rem_rgba(69,46,24,0.2))]"
            src="/media/images/landing/method/archive-method-composition.png"
            :alt="$t('about.figureAlt')"
          >
          <figcaption class="mt-3 ml-[clamp(1rem,4vw,3.5rem)] flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-sm text-archive-muted compact:mt-2 compact:ml-2 compact:text-xs">
            <span class="tracking-widest text-archive-red uppercase">{{ $t('about.figureLabel') }}</span>
            {{ $t('about.figureCaption') }}
          </figcaption>
        </figure>
      </section>

      <ArchiveInsetDivider />

      <article class="[ about-editorial ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4" :aria-label="$t('about.articleAria')">
        <template v-for="(section, index) in editorialSections" :key="section.id">
          <ArchiveEditorialSection
            :id="section.id"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :accent="section.accent"
            :paragraphs="section.paragraphs"
            :emphasized-terms="section.emphasizedTerms"
          />
          <ArchiveInsetDivider v-if="index < editorialSections.length - 1" />
        </template>
      </article>

      <ArchiveExhibitionsDivider />

      <section class="[ about-page-actions ] [ section-band ] mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-10 px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:grid-cols-1 compact:gap-5 compact:px-4 compact:py-8" aria-labelledby="about-actions-title">
        <div>
          <p class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('about.actionsEyebrow') }}</p>
          <h2 id="about-actions-title" class="m-0 max-w-192 pb-1 font-display text-h2 font-normal leading-[1.08] compact:pb-0.5 compact:text-3xl compact:leading-tight">
            {{ $t('about.actionsTitle') }} <span class="text-archive-red">{{ $t('about.actionsAccent') }}</span>
          </h2>
        </div>
        <div class="[ about-action-links ] flex flex-wrap justify-end gap-4 compact:justify-start compact:gap-3">
          <ArchiveButton :to="localePath('/exhibitions/')" variant="primary">
            {{ $t('about.viewExhibitions') }} <ArchiveArrow />
          </ArchiveButton>
          <ArchiveButton :to="localePath('/venues/')" variant="secondary">
            {{ $t('about.viewGalleries') }} <ArchiveArrow />
          </ArchiveButton>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
