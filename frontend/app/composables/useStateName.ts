// A town's `state` and `country` are stored in English ("Styria", "Slovenia"). These return the
// name in the current language; a name missing from the locale files keeps the stored name.
const useStoredName = (group: 'states' | 'countries') => {
  const { t, te } = useI18n()
  return (name: string) => (te(`${group}.${name}`) ? t(`${group}.${name}`) : name)
}

export const useStateName = () => useStoredName('states')

export const useCountryName = () => useStoredName('countries')

/**
 * "in Österreich", "in der Schweiz": the country with its preposition, for "Galerien in …". A
 * country missing from `inCountry` reads "in <name>" (the same word in German and English).
 */
export const useInCountry = () => {
  const { t, te } = useI18n()
  const countryName = useCountryName()
  return (country: string) => (te(`inCountry.${country}`) ? t(`inCountry.${country}`) : `in ${countryName(country)}`)
}
