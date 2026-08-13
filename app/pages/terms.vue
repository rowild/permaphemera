<script setup lang="ts">
import type { LegalRecordItem, LegalSection } from '~/types/legal'

const { t } = useI18n()

const recordItems = computed<LegalRecordItem[]>(() => [
  { label: t('legal.common.document'), value: t('legal.terms.recordType') },
  { label: t('legal.common.project'), value: 'PERMAPHEMERA' },
  { label: t('legal.common.operator'), value: 'Robert Wildling' },
  { label: t('legal.common.updated'), value: t('legal.common.updatedValue') }
])

const sections = computed<LegalSection[]>(() => [
  {
    id: 'scope',
    eyebrow: t('legal.terms.sections.scope.eyebrow'),
    title: t('legal.terms.sections.scope.title'),
    paragraphs: [t('legal.terms.sections.scope.p1'), t('legal.terms.sections.scope.p2')]
  },
  {
    id: 'archive-information',
    eyebrow: t('legal.terms.sections.information.eyebrow'),
    title: t('legal.terms.sections.information.title'),
    paragraphs: [t('legal.terms.sections.information.p1'), t('legal.terms.sections.information.p2')]
  },
  {
    id: 'permitted-use',
    eyebrow: t('legal.terms.sections.use.eyebrow'),
    title: t('legal.terms.sections.use.title'),
    paragraphs: [t('legal.terms.sections.use.p1')],
    items: [t('legal.terms.sections.use.personal'), t('legal.terms.sections.use.noReuse'), t('legal.terms.sections.use.noInterference')]
  },
  {
    id: 'rights-and-credits',
    eyebrow: t('legal.terms.sections.rights.eyebrow'),
    title: t('legal.terms.sections.rights.title'),
    paragraphs: [t('legal.terms.sections.rights.p1'), t('legal.terms.sections.rights.p2')]
  },
  {
    id: 'external-links',
    eyebrow: t('legal.terms.sections.links.eyebrow'),
    title: t('legal.terms.sections.links.title'),
    paragraphs: [t('legal.terms.sections.links.p1'), t('legal.terms.sections.links.p2')]
  },
  {
    id: 'availability-and-liability',
    eyebrow: t('legal.terms.sections.liability.eyebrow'),
    title: t('legal.terms.sections.liability.title'),
    paragraphs: [t('legal.terms.sections.liability.p1'), t('legal.terms.sections.liability.p2')]
  },
  {
    id: 'changes-and-law',
    eyebrow: t('legal.terms.sections.changes.eyebrow'),
    title: t('legal.terms.sections.changes.title'),
    paragraphs: [t('legal.terms.sections.changes.p1'), t('legal.terms.sections.changes.p2')]
  }
])

useSeoMeta({
  title: () => t('legal.terms.seoTitle'),
  description: () => t('legal.terms.seoDescription')
})
</script>

<template>
  <ArchiveLegalPage
    :breadcrumb="$t('legal.terms.breadcrumb')"
    :eyebrow="$t('legal.terms.eyebrow')"
    :title="$t('legal.terms.title')"
    :accent="$t('legal.terms.accent')"
    :intro="$t('legal.terms.intro')"
    :record-label="$t('legal.common.recordLabel')"
    :record-aria="$t('legal.terms.recordAria')"
    :article-aria="$t('legal.terms.articleAria')"
    :record-items="recordItems"
    :sections="sections"
  />
</template>
