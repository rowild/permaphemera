/**
 * A single day as the site writes it: "19. Dezember 2026" / "19 December 2026" (British order in
 * English everywhere), short month on request, and with `noBreak` on one line when a note wraps.
 * The day is read at noon in Vienna, so it never moves to the day before or after.
 */
export const formatArchiveDate = (date: string, locale: string, { month = 'long', noBreak = false }: { month?: 'long' | 'short', noBreak?: boolean } = {}): string => {
  const text = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-AT', { day: 'numeric', month, year: 'numeric', timeZone: 'Europe/Vienna' })
    .format(new Date(`${date}T12:00:00Z`))
  return noBreak ? text.replaceAll(' ', ' ') : text
}
