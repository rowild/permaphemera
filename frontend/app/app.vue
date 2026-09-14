<script setup lang="ts">
const { localeProperties } = useI18n()
const route = useRoute()
const { trackPageView } = useMatomo()

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
  <NuxtPage />
  <ArchiveCookieNotice />
</template>
