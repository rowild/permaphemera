<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

interface EditorialSection {
  id: string
  eyebrow: string
  title: string
  accent: string
  paragraphs: string[]
}

const methodSteps = computed(() => [
  {
    icon: '/media/images/landing/method/steps/captured.png',
    number: '01',
    title: t('landing.method.steps.captured.title'),
    text: t('landing.method.steps.captured.text')
  },
  {
    icon: '/media/images/landing/method/steps/connected.png',
    number: '02',
    title: t('landing.method.steps.connected.title'),
    text: t('landing.method.steps.connected.text')
  },
  {
    icon: '/media/images/landing/method/steps/preserved.png',
    number: '03',
    title: t('landing.method.steps.preserved.title'),
    text: t('landing.method.steps.preserved.text')
  }
])

const selectionSection = computed<EditorialSection>(() => ({
  id: 'selection',
  eyebrow: t('howItWorksPage.sections.selection.eyebrow'),
  title: t('howItWorksPage.sections.selection.title'),
  accent: t('howItWorksPage.sections.selection.accent'),
  paragraphs: [
    t('howItWorksPage.sections.selection.p1'),
    t('howItWorksPage.sections.selection.p2')
  ]
}))

const editorialSections = computed<EditorialSection[]>(() => [
  {
    id: 'spatial-capture',
    eyebrow: t('howItWorksPage.sections.capture.eyebrow'),
    title: t('howItWorksPage.sections.capture.title'),
    accent: t('howItWorksPage.sections.capture.accent'),
    paragraphs: [
      t('howItWorksPage.sections.capture.p1'),
      t('howItWorksPage.sections.capture.p2')
    ]
  },
  {
    id: 'context',
    eyebrow: t('howItWorksPage.sections.context.eyebrow'),
    title: t('howItWorksPage.sections.context.title'),
    accent: t('howItWorksPage.sections.context.accent'),
    paragraphs: [
      t('howItWorksPage.sections.context.p1'),
      t('howItWorksPage.sections.context.p2')
    ]
  },
  {
    id: 'access',
    eyebrow: t('howItWorksPage.sections.access.eyebrow'),
    title: t('howItWorksPage.sections.access.title'),
    accent: t('howItWorksPage.sections.access.accent'),
    paragraphs: [
      t('howItWorksPage.sections.access.p1'),
      t('howItWorksPage.sections.access.p2')
    ]
  }
])

useSeoMeta({
  title: () => t('howItWorksPage.seoTitle'),
  description: () => t('howItWorksPage.seoDescription')
})
</script>

<template>
  <main class="[ site-shell ] [ how-it-works-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />

    <div id="main-content">
      <section class="[ how-it-works-intro ] [ section-band ] relative mx-auto grid min-h-144 max-w-[105rem] grid-cols-[minmax(0,0.88fr)_minmax(28rem,1.12fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:min-h-0 tablet:grid-cols-1 tablet:gap-10 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="how-it-works-page-title">
        <header class="[ how-it-works-heading ] tablet:row-start-2">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('howItWorksPage.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">
            {{ $t('howItWorksPage.eyebrow') }}
          </p>
          <h1 id="how-it-works-page-title" class="m-0 max-w-216 pb-2 font-display text-hero font-light leading-[0.98] tablet:text-h1-steep compact:pb-1 compact:text-5xl compact:leading-[1.04]">
            {{ $t('howItWorksPage.title') }} <span class="text-archive-red">{{ $t('howItWorksPage.accent') }}</span>
          </h1>
          <p class="mt-5 mb-0 max-w-152 text-lg leading-relaxed text-archive-body compact:mt-4 compact:text-base">
            {{ $t('howItWorksPage.intro') }}
          </p>
        </header>

        <figure class="[ how-it-works-figure ] relative m-0 tablet:row-start-1">
          <img
            class="block h-auto w-full object-contain filter-[drop-shadow(0_1.15rem_1.25rem_rgba(69,46,24,0.2))]"
            src="/media/images/landing/method/archive-method-composition.png"
            :alt="$t('howItWorksPage.figureAlt')"
          >
          <figcaption class="mt-3 ml-[clamp(1rem,4vw,3.5rem)] flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-sm text-archive-muted compact:mt-2 compact:ml-2 compact:text-xs">
            <span class="tracking-widest text-archive-red uppercase">{{ $t('howItWorksPage.figureLabel') }}</span>
            {{ $t('howItWorksPage.figureCaption') }}
          </figcaption>
        </figure>
      </section>

      <ArchiveInsetDivider />

      <article class="[ how-it-works-editorial ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4" :aria-label="$t('howItWorksPage.articleAria')">
        <ArchiveEditorialSection v-bind="selectionSection" />

        <section class="[ how-it-works-process ] py-[clamp(2.8rem,5vw,4.8rem)]" aria-labelledby="how-it-works-process-title">
          <header class="mb-10 max-w-216 compact:mb-6">
            <p class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">
              {{ $t('howItWorksPage.processEyebrow') }}
            </p>
            <h2 id="how-it-works-process-title" class="m-0 max-w-192 pb-1 font-display text-h2 font-normal leading-[1.04] compact:pb-0.5 compact:text-3xl compact:leading-tight">
              {{ $t('howItWorksPage.processTitle') }} <span class="text-archive-red">{{ $t('howItWorksPage.processAccent') }}</span>
            </h2>
            <p class="mt-4 mb-0 max-w-180 font-display text-lg leading-relaxed text-archive-body compact:mt-3 compact:text-base">
              {{ $t('howItWorksPage.processIntro') }}
            </p>
          </header>

          <div class="[ method-steps ] archive-method-steps-frame relative z-1 grid grid-cols-3 gap-0 border-16 border-transparent bg-transparent px-[0.6rem] py-[0.35rem] shadow-none compact:grid-cols-1">
            <ArchiveMethodStep
              v-for="(step, index) in methodSteps"
              :key="step.number"
              v-bind="step"
              :divider="index < methodSteps.length - 1"
            />
          </div>
        </section>

        <ArchiveEditorialSection
          v-for="section in editorialSections"
          :key="section.id"
          v-bind="section"
        />
      </article>

      <section class="[ how-it-works-actions ] [ section-band ] mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-10 px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:grid-cols-1 compact:gap-5 compact:px-4 compact:py-8" aria-labelledby="how-it-works-actions-title">
        <div>
          <p class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('howItWorksPage.actionsEyebrow') }}</p>
          <h2 id="how-it-works-actions-title" class="m-0 max-w-192 pb-1 font-display text-h2 font-normal leading-[1.08] compact:pb-0.5 compact:text-3xl compact:leading-tight">
            {{ $t('howItWorksPage.actionsTitle') }} <span class="text-archive-red">{{ $t('howItWorksPage.actionsAccent') }}</span>
          </h2>
        </div>
        <div class="[ how-it-works-action-links ] flex flex-wrap justify-end gap-4 compact:justify-start compact:gap-3">
          <ArchiveButton :to="localePath('/contact/')" variant="primary">
            {{ $t('howItWorksPage.contactAction') }} <ArchiveArrow />
          </ArchiveButton>
          <ArchiveButton :to="localePath('/exhibitions/')" variant="secondary">
            {{ $t('howItWorksPage.exhibitionsAction') }} <ArchiveArrow />
          </ArchiveButton>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
