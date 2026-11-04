<script setup lang="ts">
import type { EditorialSection } from '~/types/editorial'
import { SITE_OWNER } from '~/utils/siteOwner'
const { t } = useI18n()
const localePath = useLocalePath()


const emailHref = SITE_OWNER.emailHref
const phoneHref = SITE_OWNER.phoneHref

const contactRecordItems = computed(() => [
  { label: t('contactPage.record.project'), value: 'PERMAPHEMERA' },
  { label: t('contactPage.record.responsible'), value: SITE_OWNER.name },
  { label: t('contactPage.record.address'), value: t('contactPage.record.addressValue') },
  { label: t('contactPage.record.email'), value: SITE_OWNER.email, href: emailHref },
  { label: t('contactPage.record.phone'), value: SITE_OWNER.phone, href: phoneHref }
])

const editorialSections = computed<EditorialSection[]>(() => [
  {
    id: 'reasons-to-write',
    eyebrow: t('contactPage.sections.reasons.eyebrow'),
    title: t('contactPage.sections.reasons.title'),
    accent: t('contactPage.sections.reasons.accent'),
    paragraphs: [t('contactPage.sections.reasons.p1')],
    items: [
      t('contactPage.sections.reasons.item1'),
      t('contactPage.sections.reasons.item2'),
      t('contactPage.sections.reasons.item3'),
      t('contactPage.sections.reasons.item4')
    ]
  },
  {
    id: 'first-message',
    eyebrow: t('contactPage.sections.message.eyebrow'),
    title: t('contactPage.sections.message.title'),
    accent: t('contactPage.sections.message.accent'),
    paragraphs: [
      t('contactPage.sections.message.p1'),
      t('contactPage.sections.message.p2')
    ]
  },
  {
    id: 'selection-and-reply',
    eyebrow: t('contactPage.sections.selection.eyebrow'),
    title: t('contactPage.sections.selection.title'),
    accent: t('contactPage.sections.selection.accent'),
    paragraphs: [
      t('contactPage.sections.selection.p1'),
      t('contactPage.sections.selection.p2')
    ]
  }
])

usePageSeo('/contact/')
</script>

<template>
  <div class="[ contact-page ]">

      <ArchiveEditorialHero title-id="contact-page-title" layout="aside">
          <ArchiveBreadcrumb :items="[{ label: $t('contactPage.breadcrumb') }]" />
          <ArchiveEyebrow>
            {{ $t('contactPage.eyebrow') }}
          </ArchiveEyebrow>
          <ArchivePageTitle title-id="contact-page-title" :title="$t('contactPage.title')" :accent="$t('contactPage.accent')" :intro="$t('contactPage.intro')" />

          <template #aside>
        <ArchiveFactRecord :label="$t('contactPage.record.label')" :record-aria="$t('contactPage.record.aria')" :items="contactRecordItems" address stamp />

          </template>

      </ArchiveEditorialHero>

      <ArchiveInsetDivider />

      <article class="[ contact-editorial ] [ section-band ] relative mx-auto max-w-band px-gutter compact:px-4" :aria-label="$t('contactPage.articleAria')">
        <ArchiveEditorialSection
          v-for="section in editorialSections"
          :key="section.id"
          v-bind="section"
        />
      </article>

      <ArchiveActionBand title-id="contact-actions-title" :eyebrow="$t('contactPage.actionsEyebrow')" :title="$t('contactPage.actionsTitle')" :accent="$t('contactPage.actionsAccent')">
            {{ $t('contactPage.privacyNote') }}
            <ArchiveTextLink :to="localePath('/privacy/')">{{ $t('contactPage.privacyAction') }}</ArchiveTextLink>

        <template #actions>
          <ArchiveActionHint id="contact-email-hint" :text="$t('contactPage.emailHint')">
            <template #default="{ describedBy }">
              <ArchiveButton :href="emailHref" :aria-describedby="describedBy" variant="primary">
                {{ $t('contactPage.emailAction') }} <ArchiveArrow />
              </ArchiveButton>
            </template>
          </ArchiveActionHint>
          <ArchiveActionHint id="contact-phone-hint" :text="$t('contactPage.phoneHint')">
            <template #default="{ describedBy }">
              <ArchiveButton :href="phoneHref" :aria-describedby="describedBy" variant="secondary">
                {{ $t('contactPage.phoneAction') }}
              </ArchiveButton>
            </template>
          </ArchiveActionHint>

        </template>

      </ArchiveActionBand>
  </div>
</template>
