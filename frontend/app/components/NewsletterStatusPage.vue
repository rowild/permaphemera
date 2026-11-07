<script setup lang="ts">
// The page Brevo's confirmation link leads to. A short hero with the state and the ways on;
// search engine free (shared/seo.mjs). Unsubscribing stays on Brevo's own page (owner,
// 2026-11-07), so there is no "unsubscribed" page.
const localePath = useLocalePath()
const titleId = 'newsletter-confirmed-title'
</script>

<template>
  <div class="[ newsletter-status-page ]">
    <section class="[ newsletter-status ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,6vw,6rem)] compact:px-4 compact:py-4" :aria-labelledby="titleId">
      <ArchiveBreadcrumb :items="[{ label: $t('newsletter.breadcrumb'), to: '/newsletter/' }, { label: $t('newsletter.confirmed.breadcrumb') }]" />
      <ArchiveEyebrow>{{ $t('newsletter.title') }}</ArchiveEyebrow>
      <ArchivePageTitle :title-id="titleId" :title="$t('newsletter.confirmed.title')" :intro="$t('newsletter.confirmed.intro')" />

      <div class="mt-10 flex flex-wrap gap-4 compact:mt-6 compact:grid compact:grid-cols-1 compact:gap-3">
        <ArchiveButton :to="localePath('/exhibitions/')" variant="primary">{{ $t('newsletter.confirmed.toExhibitions') }} <ArchiveArrow /></ArchiveButton>
        <ArchiveButton :to="localePath('/')" variant="secondary">{{ $t('newsletter.confirmed.toStart') }}</ArchiveButton>
      </div>
    </section>
  </div>
</template>
