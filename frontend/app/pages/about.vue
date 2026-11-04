<script setup lang="ts">
import type { EditorialSection } from '~/types/editorial'
const { t } = useI18n()
const localePath = useLocalePath()


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

usePageSeo('/about/')
definePageMeta({ navActive: 'about' })
</script>

<template>
  <div class="[ about-page ]">

      <ArchiveEditorialHero title-id="about-page-title" layout="figure">
          <ArchiveBreadcrumb :items="[{ label: $t('about.breadcrumb') }]" />
          <ArchiveEyebrow>
            {{ $t('about.eyebrow') }}
          </ArchiveEyebrow>
          <ArchivePageTitle title-id="about-page-title" :title="$t('about.title')" :accent="$t('about.accent')" :intro="$t('about.intro')" />

          <template #aside>

            <ArchiveMethodFigure :alt="$t('about.figureAlt')" :label="$t('about.figureLabel')" :caption="$t('about.figureCaption')" />

          </template>

      </ArchiveEditorialHero>

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

      <ArchiveActionBand title-id="about-actions-title" :eyebrow="$t('about.actionsEyebrow')" :title="$t('about.actionsTitle')" :accent="$t('about.actionsAccent')">

        <template #actions>
          <ArchiveButton :to="localePath('/exhibitions/')" variant="primary">
            {{ $t('about.viewExhibitions') }} <ArchiveArrow />
          </ArchiveButton>
          <ArchiveButton :to="localePath('/venues/')" variant="secondary">
            {{ $t('about.viewGalleries') }} <ArchiveArrow />
          </ArchiveButton>

        </template>

      </ArchiveActionBand>
  </div>
</template>
