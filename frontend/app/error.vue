<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()
useDocumentLang()

// Nuxt names an unknown route in English ("Page not found: /x/"); the site's own errors carry
// their message in the visitor's language already.
const title = computed(() => props.error.statusCode === 404 && (!props.error.statusMessage || props.error.statusMessage.startsWith('Page not found'))
  ? t('site.errorNotFound')
  : props.error.statusMessage)
</script>

<template>
  <div class="[ error-page ] grid min-h-dvh place-items-center bg-archive-paper px-6 py-16 text-center">
    <div class="mx-auto flex max-w-md flex-col items-center">
      <img
        class="[ error-mark ] mb-6 size-12 flex-none object-contain opacity-82"
        src="/media/svg/brand/archive-temple.svg"
        alt=""
        width="64"
        height="64"
      >
      <p class="m-0 mb-3 font-display text-xs tracking-widest text-archive-red uppercase">{{ props.error.statusCode }}</p>
      <h1 class="m-0 mb-4 font-display text-h3 leading-tight text-archive-red">{{ title }}</h1>
      <p class="m-0 mb-8 font-display text-lede text-archive-muted">{{ t('site.errorExplanation') }}</p>
      <ArchiveButton :to="localePath('/')">{{ t('site.errorHome') }}</ArchiveButton>
    </div>
  </div>
</template>
