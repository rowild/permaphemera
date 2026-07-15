<script setup lang="ts">
const { localeProperties } = useI18n()

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
