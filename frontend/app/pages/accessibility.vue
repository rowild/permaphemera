<script setup lang="ts">
import type { LegalRecordItem, LegalSection } from '~/types/legal'

const { t } = useI18n()

const recordItems = computed<LegalRecordItem[]>(() => [
  { label: t('legal.common.document'), value: t('legal.accessibility.recordType') },
  { label: t('legal.common.target'), value: 'WCAG 2.2 · Level AA' },
  { label: t('legal.common.method'), value: t('legal.accessibility.selfAssessment') },
  { label: t('legal.common.updated'), value: t('legal.common.updatedValue') }
])

const sections = computed<LegalSection[]>(() => [
  {
    id: 'commitment',
    eyebrow: t('legal.accessibility.sections.commitment.eyebrow'),
    title: t('legal.accessibility.sections.commitment.title'),
    paragraphs: [t('legal.accessibility.sections.commitment.p1'), t('legal.accessibility.sections.commitment.p2')]
  },
  {
    id: 'measures',
    eyebrow: t('legal.accessibility.sections.measures.eyebrow'),
    title: t('legal.accessibility.sections.measures.title'),
    paragraphs: [t('legal.accessibility.sections.measures.p1')],
    items: [
      t('legal.accessibility.sections.measures.structure'),
      t('legal.accessibility.sections.measures.keyboard'),
      t('legal.accessibility.sections.measures.motion'),
      t('legal.accessibility.sections.measures.images'),
      t('legal.accessibility.sections.measures.language'),
      t('legal.accessibility.sections.measures.responsive')
    ]
  },
  {
    id: 'current-status',
    eyebrow: t('legal.accessibility.sections.status.eyebrow'),
    title: t('legal.accessibility.sections.status.title'),
    paragraphs: [t('legal.accessibility.sections.status.p1'), t('legal.accessibility.sections.status.p2')]
  },
  {
    id: 'known-limitations',
    eyebrow: t('legal.accessibility.sections.limitations.eyebrow'),
    title: t('legal.accessibility.sections.limitations.title'),
    paragraphs: [t('legal.accessibility.sections.limitations.p1')],
    items: [
      t('legal.accessibility.sections.limitations.wheel'),
      t('legal.accessibility.sections.limitations.panorama'),
      t('legal.accessibility.sections.limitations.external')
    ]
  },
  {
    id: 'feedback',
    eyebrow: t('legal.accessibility.sections.feedback.eyebrow'),
    title: t('legal.accessibility.sections.feedback.title'),
    paragraphs: [t('legal.accessibility.sections.feedback.p1'), t('legal.accessibility.sections.feedback.p2')],
    details: [
      { label: t('legal.common.contact'), value: 'Robert Wildling' },
      { label: t('legal.common.email'), value: 'office@rowild.at', href: 'mailto:office@rowild.at' },
      { label: t('legal.common.phone'), value: '+43 676 6089613', href: 'tel:+436766089613' }
    ]
  },
  {
    id: 'standard-and-assessment',
    eyebrow: t('legal.common.sources'),
    title: t('legal.accessibility.sections.standard.title'),
    paragraphs: [t('legal.accessibility.sections.standard.p1'), t('legal.accessibility.sections.standard.p2')],
    links: [
      { label: 'WCAG 2.2 · W3C Recommendation', href: 'https://www.w3.org/TR/WCAG22/' },
      { label: t('legal.accessibility.sections.standard.wzg'), href: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20010727' }
    ]
  }
])

useSeoMeta({
  title: () => t('legal.accessibility.seoTitle'),
  description: () => t('legal.accessibility.seoDescription')
})
</script>

<template>
  <ArchiveLegalPage
    :breadcrumb="$t('legal.accessibility.breadcrumb')"
    :eyebrow="$t('legal.accessibility.eyebrow')"
    :title="$t('legal.accessibility.title')"
    :accent="$t('legal.accessibility.accent')"
    :intro="$t('legal.accessibility.intro')"
    :record-label="$t('legal.common.recordLabel')"
    :record-aria="$t('legal.accessibility.recordAria')"
    :article-aria="$t('legal.accessibility.articleAria')"
    :record-items="recordItems"
    :sections="sections"
  />
</template>
