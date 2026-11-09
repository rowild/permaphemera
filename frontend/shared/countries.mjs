// frontend/shared/countries.mjs
// Owner, 2026-11-09 (docs/text-rules.md §5a): the archive records exhibitions in Austria and also
// those abroad that are tied to Austria. For now, the overview pages (start page, /exhibitions/,
// current, upcoming, past) and the newsletter's town list show only galleries in Austria;
// /venues/ shows all and counts each country on its own. Change the rule here, in one place.

/** Towns store their country in English. */
export const HOME_COUNTRY = 'Austria'

/** True for Austria. A town without a country (older records) counts as Austrian. */
export const inHomeCountry = (country) => !country || country === HOME_COUNTRY || country === 'Österreich'
