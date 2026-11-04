<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

// The archive loads in the background. A page whose meta says `archiveOptional`
// (the start page) renders at once and fills in; every other page waits.
const { archive, error, directusUrl } = useArchiveSource()
watch(error, (value) => {
  if (value) showError(createError({ statusCode: 503, statusMessage: t('site.archiveUnavailable', { url: directusUrl }), fatal: true }))
}, { immediate: true })

useDocumentLang()
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout v-if="archive || route.meta.archiveOptional">
    <NuxtPage />
  </NuxtLayout>
  <p v-else class="[ archive-loading ] m-0 grid min-h-dvh place-items-center font-display text-lg text-archive-muted">{{ $t('site.archiveLoading') }}</p>
  <ArchiveCookieNotice />
</template>
