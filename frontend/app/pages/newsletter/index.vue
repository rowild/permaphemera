<script setup lang="ts">
import type { LegalRecordItem } from '~/types/legal'

const { t } = useI18n()

const recordItems = computed<LegalRecordItem[]>(() => [
  { label: t('newsletter.record.cadence'), value: t('newsletter.record.cadenceValue') },
  { label: t('newsletter.record.sender'), value: 'newsletter@permaphemera.at' },
  { label: t('newsletter.record.provider'), value: t('newsletter.record.providerValue') },
  { label: t('newsletter.record.tracking'), value: t('newsletter.record.trackingValue') },
  { label: t('newsletter.record.unsubscribe'), value: t('newsletter.record.unsubscribeValue') }
])

usePageSeo('/newsletter/')
</script>

<template>
  <div class="[ newsletter-page ]">
    <ArchiveEditorialHero title-id="newsletter-page-title" layout="aside">
      <ArchiveBreadcrumb :items="[{ label: $t('newsletter.breadcrumb') }]" />
      <ArchiveEyebrow>{{ $t('newsletter.eyebrow') }}</ArchiveEyebrow>
      <ArchivePageTitle title-id="newsletter-page-title" :title="$t('newsletter.title')" :intro="$t('newsletter.intro')" />

      <template #aside>
        <ArchiveFactRecord :label="$t('newsletter.record.label')" :record-aria="$t('newsletter.record.aria')" :items="recordItems" />
      </template>
    </ArchiveEditorialHero>

    <ArchiveInsetDivider />

    <section class="[ newsletter-signup ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(2.5rem,5vw,5rem)] compact:px-4 compact:py-6" aria-labelledby="newsletter-form-title">
      <ArchiveSectionHeading id="newsletter-form-title" class="mb-8 compact:mb-4">{{ $t('newsletter.formTitle') }}</ArchiveSectionHeading>
      <div class="max-w-232">
        <ArchiveNewsletterForm />
      </div>
    </section>
  </div>
</template>
