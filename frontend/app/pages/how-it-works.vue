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

usePageSeo('/how-it-works/')
</script>

<template>
  <div class="[ how-it-works-page ]">

      <ArchiveEditorialHero title-id="how-it-works-page-title" layout="figure">
          <ArchiveBreadcrumb :items="[{ label: $t('howItWorksPage.breadcrumb') }]" />
          <ArchiveEyebrow>
            {{ $t('howItWorksPage.eyebrow') }}
          </ArchiveEyebrow>
          <ArchivePageTitle title-id="how-it-works-page-title" :title="$t('howItWorksPage.title')" :accent="$t('howItWorksPage.accent')" :intro="$t('howItWorksPage.intro')" />

          <template #aside>

            <ArchiveMethodFigure :alt="$t('howItWorksPage.figureAlt')" :label="$t('howItWorksPage.figureLabel')" :caption="$t('howItWorksPage.figureCaption')" />

          </template>

      </ArchiveEditorialHero>

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

      <ArchiveActionBand title-id="how-it-works-actions-title" :eyebrow="$t('howItWorksPage.actionsEyebrow')" :title="$t('howItWorksPage.actionsTitle')" :accent="$t('howItWorksPage.actionsAccent')">

        <template #actions>
          <ArchiveButton :to="localePath('/contact/')" variant="primary">
            {{ $t('howItWorksPage.contactAction') }} <ArchiveArrow />
          </ArchiveButton>
          <ArchiveButton :to="localePath('/exhibitions/')" variant="secondary">
            {{ $t('howItWorksPage.exhibitionsAction') }} <ArchiveArrow />
          </ArchiveButton>

        </template>

      </ArchiveActionBand>
  </div>
</template>
