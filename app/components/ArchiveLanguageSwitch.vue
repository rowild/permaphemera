<script setup lang="ts">
const props = withDefaults(defineProps<{
  inverted?: boolean
}>(), {
  inverted: false
})

const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePreference = useCookie<string>('permaphemera-locale', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax'
})
const switching = ref(false)
const languages = computed(() => (locales.value as Array<{ code: string; name?: string }>).map((language) => ({
  code: language.code,
  label: language.code.toLocaleUpperCase()
})))

const switchLanguage = async (localeCode: string) => {
  if (locale.value === localeCode || switching.value) return

  switching.value = true

  try {
    const targetPath = switchLocalePath(localeCode)
    localePreference.value = localeCode
    await setLocale(localeCode)
    await navigateTo(targetPath)
  } finally {
    switching.value = false
  }
}
</script>

<template>
  <div
    class="inline-flex items-center gap-4 font-display text-base font-normal leading-none compact:gap-2 compact:text-sm"
    :class="props.inverted ? 'text-archive-footer-copy/82' : 'text-archive-muted'"
    :aria-label="$t('language.switcherAria')"
  >
    <template v-for="(language, index) in languages" :key="language.code">
      <button
        class="cursor-pointer border-0 bg-transparent p-0 text-inherit transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red current-page:text-archive-red disabled:cursor-default"
        type="button"
        :disabled="switching"
        :aria-current="locale === language.code ? 'page' : undefined"
        :aria-pressed="locale === language.code"
        @click="switchLanguage(language.code)"
      >
        {{ language.label }}
      </button>
      <span v-if="index < languages.length - 1" aria-hidden="true">/</span>
    </template>
  </div>
</template>
