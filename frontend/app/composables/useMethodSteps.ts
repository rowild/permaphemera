/** The three steps from exhibition to tour (start page, how it works), in the current language. */
export const useMethodSteps = () => {
  const { t } = useNuxtApp().$i18n
  return computed(() => (['captured', 'connected', 'preserved'] as const).map((step, index) => ({
    icon: `/media/images/landing/method/steps/${step}.png`,
    number: String(index + 1).padStart(2, '0'),
    title: t(`landing.method.steps.${step}.title`),
    text: t(`landing.method.steps.${step}.text`)
  })))
}
