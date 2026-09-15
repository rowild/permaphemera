<script setup lang="ts">
const { localeProperties, t } = useI18n()
const route = useRoute()
const { trackPageView } = useMatomo()

const { archive, error, directusUrl } = await useArchiveSource()
if (error.value) {
  throw createError({ statusCode: 503, statusMessage: t('site.archiveUnavailable', { url: directusUrl }), fatal: true })
}

watch(() => route.fullPath, async (nextPath, previousPath) => {
  if (!previousPath || nextPath === previousPath) return
  await nextTick()
  trackPageView()
})

useHead(() => ({
  htmlAttrs: {
    lang: localeProperties.value.language ?? localeProperties.value.code,
    dir: localeProperties.value.dir ?? 'ltr'
  }
}))
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage v-if="archive" />
  <p v-else class="[ archive-loading ] m-0 grid min-h-dvh place-items-center font-display text-lg text-archive-muted">{{ $t('site.archiveLoading') }}</p>
  <ArchiveCookieNotice />
</template>
