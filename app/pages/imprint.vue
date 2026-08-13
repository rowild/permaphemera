<script setup lang="ts">
import type { LegalRecordItem, LegalSection } from '~/types/legal'

const { t } = useI18n()

const recordItems = computed<LegalRecordItem[]>(() => [
  { label: t('legal.common.document'), value: t('legal.imprint.recordType') },
  { label: t('legal.common.project'), value: 'PERMAPHEMERA' },
  { label: t('legal.common.responsible'), value: 'Robert Wildling' },
  { label: t('legal.common.updated'), value: t('legal.common.updatedValue') }
])

const sections = computed<LegalSection[]>(() => [
  {
    id: 'provider',
    eyebrow: t('legal.imprint.sections.provider.eyebrow'),
    title: t('legal.imprint.sections.provider.title'),
    paragraphs: [t('legal.imprint.sections.provider.p1')],
    details: [
      { label: t('legal.imprint.sections.provider.roleLabel'), value: t('legal.imprint.sections.provider.roleValue') },
      { label: t('legal.common.name'), value: 'Robert Wildling' },
      { label: t('legal.common.address'), value: 'Göllnergasse 19/30, A-1030 Wien, Österreich' },
      { label: t('legal.common.email'), value: 'office@rowild.at', href: 'mailto:office@rowild.at' },
      { label: t('legal.common.phone'), value: '+43 676 6089613', href: 'tel:+436766089613' }
    ]
  },
  {
    id: 'editorial-responsibility',
    eyebrow: t('legal.imprint.sections.direction.eyebrow'),
    title: t('legal.imprint.sections.direction.title'),
    paragraphs: [t('legal.imprint.sections.direction.p1'), t('legal.imprint.sections.direction.p2')]
  },
  {
    id: 'project-status',
    eyebrow: t('legal.imprint.sections.status.eyebrow'),
    title: t('legal.imprint.sections.status.title'),
    paragraphs: [t('legal.imprint.sections.status.p1'), t('legal.imprint.sections.status.p2')]
  },
  {
    id: 'copyright',
    eyebrow: t('legal.imprint.sections.copyright.eyebrow'),
    title: t('legal.imprint.sections.copyright.title'),
    paragraphs: [t('legal.imprint.sections.copyright.p1'), t('legal.imprint.sections.copyright.p2')]
  },
  {
    id: 'legal-basis',
    eyebrow: t('legal.common.sources'),
    title: t('legal.imprint.sections.sources.title'),
    paragraphs: [t('legal.imprint.sections.sources.p1')],
    links: [
      { label: t('legal.imprint.sections.sources.ecg'), href: 'https://ris.bka.gv.at/eli/bgbl/i/2001/152/P5/NOR40025801' },
      { label: t('legal.imprint.sections.sources.media'), href: 'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10000719&Paragraf=25' }
    ]
  }
])

useSeoMeta({
  title: () => t('legal.imprint.seoTitle'),
  description: () => t('legal.imprint.seoDescription')
})
</script>

<template>
  <ArchiveLegalPage
    :breadcrumb="$t('legal.imprint.breadcrumb')"
    :eyebrow="$t('legal.imprint.eyebrow')"
    :title="$t('legal.imprint.title')"
    :accent="$t('legal.imprint.accent')"
    :intro="$t('legal.imprint.intro')"
    :record-label="$t('legal.common.recordLabel')"
    :record-aria="$t('legal.imprint.recordAria')"
    :article-aria="$t('legal.imprint.articleAria')"
    :record-items="recordItems"
    :sections="sections"
  />
</template>
