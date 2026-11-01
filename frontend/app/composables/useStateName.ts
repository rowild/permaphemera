// A town's `state` is stored in English ("Styria"). This returns its name in the
// current language; a state missing from the locale files keeps the stored name.
export const useStateName = () => {
  const { t, te } = useI18n()
  return (state: string) => (te(`states.${state}`) ? t(`states.${state}`) : state)
}
