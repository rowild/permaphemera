<script setup lang="ts">
// The two pages Brevo's links lead to: after the confirmation click and after unsubscribing.
// A short hero with the state and the ways on; both search engine free (shared/seo.mjs).
const props = defineProps<{ page: 'confirmed' | 'unsubscribed' }>()
const localePath = useLocalePath()

const titleId = computed(() => `newsletter-${props.page}-title`)
</script>

<template>
  <div class="[ newsletter-status-page ]">
    <section class="[ newsletter-status ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,6vw,6rem)] compact:px-4 compact:py-4" :aria-labelledby="titleId">
      <ArchiveBreadcrumb :items="[{ label: $t('newsletter.breadcrumb'), to: '/newsletter/' }, { label: $t(`newsletter.${props.page}.breadcrumb`) }]" />
      <ArchiveEyebrow>{{ $t('newsletter.title') }}</ArchiveEyebrow>
      <ArchivePageTitle :title-id="titleId" :title="$t(`newsletter.${props.page}.title`)" :intro="$t(`newsletter.${props.page}.intro`)" />

      <div class="mt-10 flex flex-wrap gap-4 compact:mt-6 compact:grid compact:grid-cols-1 compact:gap-3">
        <template v-if="props.page === 'confirmed'">
          <ArchiveButton :to="localePath('/exhibitions/')" variant="primary">{{ $t('newsletter.confirmed.toExhibitions') }} <ArchiveArrow /></ArchiveButton>
          <ArchiveButton :to="localePath('/')" variant="secondary">{{ $t('newsletter.confirmed.toStart') }}</ArchiveButton>
        </template>
        <template v-else>
          <ArchiveButton :to="localePath('/newsletter/')" variant="primary">{{ $t('newsletter.unsubscribed.again') }} <ArchiveArrow /></ArchiveButton>
          <ArchiveButton :to="localePath('/')" variant="secondary">{{ $t('newsletter.unsubscribed.toStart') }}</ArchiveButton>
        </template>
      </div>
    </section>
  </div>
</template>
