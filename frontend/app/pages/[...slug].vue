<script setup lang="ts">
// Every unknown address: the site's own 404 in the visitor's language. Without this page Nuxt
// raises its built-in English 404 while the app starts, before the page head can be written.
const { t } = useI18n()
throw createError({ statusCode: 404, statusMessage: t('site.errorNotFound'), fatal: true })
</script>

<template>
  <div />
</template>
