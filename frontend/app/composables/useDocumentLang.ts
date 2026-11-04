/** The `lang` and `dir` of the document follow the current language: app.vue and error.vue. */
export const useDocumentLang = () => {
  const { localeProperties } = useI18n()
  useHead(() => ({
    htmlAttrs: {
      lang: localeProperties.value.language ?? localeProperties.value.code,
      dir: localeProperties.value.dir ?? 'ltr'
    }
  }))
}
