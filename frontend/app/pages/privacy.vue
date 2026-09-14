<script setup lang="ts">
import type { LegalRecordItem, LegalSection } from '~/types/legal'

const { t } = useI18n()

const recordItems = computed<LegalRecordItem[]>(() => [
  { label: t('legal.common.document'), value: t('legal.privacy.recordType') },
  { label: t('legal.common.controller'), value: 'Robert Wildling' },
  { label: t('legal.common.hosting'), value: 'ALL-INKL.COM · Neue Medien Münnich' },
  { label: t('legal.common.updated'), value: t('legal.common.updatedValue') }
])

const sections = computed<LegalSection[]>(() => [
  {
    id: 'controller',
    eyebrow: t('legal.privacy.sections.controller.eyebrow'),
    title: t('legal.privacy.sections.controller.title'),
    paragraphs: [t('legal.privacy.sections.controller.p1')],
    details: [
      { label: t('legal.common.name'), value: 'Robert Wildling' },
      { label: t('legal.common.address'), value: 'Göllnergasse 19/30, A-1030 Wien, Österreich' },
      { label: t('legal.common.email'), value: 'office@rowild.at', href: 'mailto:office@rowild.at' },
      { label: t('legal.common.phone'), value: '+43 676 6089613', href: 'tel:+436766089613' }
    ]
  },
  {
    id: 'hosting-and-logs',
    eyebrow: t('legal.privacy.sections.hosting.eyebrow'),
    title: t('legal.privacy.sections.hosting.title'),
    paragraphs: [
      t('legal.privacy.sections.hosting.p1'),
      t('legal.privacy.sections.hosting.p2'),
      t('legal.privacy.sections.hosting.p3')
    ],
    details: [
      { label: t('legal.privacy.sections.hosting.providerLabel'), value: 'ALL-INKL.COM · Neue Medien Münnich, Inhaber René Münnich' },
      { label: t('legal.privacy.sections.hosting.addressLabel'), value: 'Hauptstraße 68, D-02742 Friedersdorf, Deutschland' },
      { label: t('legal.privacy.sections.hosting.retentionLabel'), value: t('legal.privacy.sections.hosting.retentionValue') }
    ],
    links: [
      { label: t('legal.privacy.sections.hosting.providerPrivacy'), href: 'https://all-inkl.com/datenschutzinformationen/' }
    ]
  },
  {
    id: 'local-storage',
    eyebrow: t('legal.privacy.sections.storage.eyebrow'),
    title: t('legal.privacy.sections.storage.title'),
    paragraphs: [t('legal.privacy.sections.storage.p1')],
    details: [
      { label: 'permaphemera-locale', value: t('legal.privacy.sections.storage.locale') },
      { label: 'permaphemera-cookie-consent', value: t('legal.privacy.sections.storage.consent') }
    ]
  },
  {
    id: 'contact',
    eyebrow: t('legal.privacy.sections.contact.eyebrow'),
    title: t('legal.privacy.sections.contact.title'),
    paragraphs: [t('legal.privacy.sections.contact.p1'), t('legal.privacy.sections.contact.p2')]
  },
  {
    id: 'editorial-archive',
    eyebrow: t('legal.privacy.sections.editorial.eyebrow'),
    title: t('legal.privacy.sections.editorial.title'),
    paragraphs: [
      t('legal.privacy.sections.editorial.p1'),
      t('legal.privacy.sections.editorial.p2'),
      t('legal.privacy.sections.editorial.p3')
    ]
  },
  {
    id: 'matomo-analytics',
    eyebrow: t('legal.privacy.sections.analytics.eyebrow'),
    title: t('legal.privacy.sections.analytics.title'),
    paragraphs: [
      t('legal.privacy.sections.analytics.p1'),
      t('legal.privacy.sections.analytics.p2'),
      t('legal.privacy.sections.analytics.p3'),
      t('legal.privacy.sections.analytics.p4')
    ],
    details: [
      { label: t('legal.privacy.sections.analytics.instanceLabel'), value: 'https://matomo.rowild.at/' },
      { label: t('legal.privacy.sections.analytics.siteLabel'), value: '9' },
      { label: t('legal.privacy.sections.analytics.consentLabel'), value: t('legal.privacy.sections.analytics.consentValue') }
    ],
    links: [
      { label: t('legal.privacy.sections.analytics.matomoConsent'), href: 'https://developer.matomo.org/guides/tracking-consent' },
      { label: t('legal.privacy.sections.analytics.matomoCookies'), href: 'https://matomo.org/faq/general/faq_146/' }
    ]
  },
  {
    id: 'external-media',
    eyebrow: t('legal.privacy.sections.externalMedia.eyebrow'),
    title: t('legal.privacy.sections.externalMedia.title'),
    paragraphs: [
      t('legal.privacy.sections.externalMedia.p1'),
      t('legal.privacy.sections.externalMedia.p2'),
      t('legal.privacy.sections.externalMedia.p3')
    ],
    details: [
      { label: t('legal.privacy.sections.externalMedia.mapsLabel'), value: t('legal.privacy.sections.externalMedia.mapsValue') },
      { label: t('legal.privacy.sections.externalMedia.youtubeLabel'), value: t('legal.privacy.sections.externalMedia.youtubeValue') },
      { label: t('legal.privacy.sections.externalMedia.activationLabel'), value: t('legal.privacy.sections.externalMedia.activationValue') }
    ],
    links: [
      { label: t('legal.privacy.sections.externalMedia.googlePrivacy'), href: 'https://policies.google.com/privacy' },
      { label: t('legal.privacy.sections.externalMedia.mapsPolicy'), href: 'https://developers.google.com/maps/documentation/javascript/policies' },
      { label: t('legal.privacy.sections.externalMedia.youtubePrivacy'), href: 'https://support.google.com/youtube/answer/171780?hl=en' }
    ]
  },
  {
    id: 'planned-newsletter',
    eyebrow: t('legal.privacy.sections.planned.eyebrow'),
    title: t('legal.privacy.sections.planned.title'),
    paragraphs: [t('legal.privacy.sections.planned.p1'), t('legal.privacy.sections.planned.p2')],
    items: [t('legal.privacy.sections.planned.newsletter')]
  },
  {
    id: 'recipients-and-transfers',
    eyebrow: t('legal.privacy.sections.recipients.eyebrow'),
    title: t('legal.privacy.sections.recipients.title'),
    paragraphs: [t('legal.privacy.sections.recipients.p1'), t('legal.privacy.sections.recipients.p2')]
  },
  {
    id: 'your-rights',
    eyebrow: t('legal.privacy.sections.rights.eyebrow'),
    title: t('legal.privacy.sections.rights.title'),
    paragraphs: [t('legal.privacy.sections.rights.p1'), t('legal.privacy.sections.rights.p2')],
    items: [
      t('legal.privacy.sections.rights.access'),
      t('legal.privacy.sections.rights.rectification'),
      t('legal.privacy.sections.rights.erasure'),
      t('legal.privacy.sections.rights.restriction'),
      t('legal.privacy.sections.rights.portability'),
      t('legal.privacy.sections.rights.objection'),
      t('legal.privacy.sections.rights.withdrawal')
    ],
    links: [
      { label: t('legal.privacy.sections.rights.authority'), href: 'https://dsb.gv.at/' },
      { label: t('legal.privacy.sections.rights.gdpr'), href: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng' }
    ]
  }
])

useSeoMeta({
  title: () => t('legal.privacy.seoTitle'),
  description: () => t('legal.privacy.seoDescription')
})
</script>

<template>
  <ArchiveLegalPage
    :breadcrumb="$t('legal.privacy.breadcrumb')"
    :eyebrow="$t('legal.privacy.eyebrow')"
    :title="$t('legal.privacy.title')"
    :accent="$t('legal.privacy.accent')"
    :intro="$t('legal.privacy.intro')"
    :record-label="$t('legal.common.recordLabel')"
    :record-aria="$t('legal.privacy.recordAria')"
    :article-aria="$t('legal.privacy.articleAria')"
    :record-items="recordItems"
    :sections="sections"
  />
</template>
