// THROWAWAY mockup data for the news plan (plans/2026-11-04__news-system.md). Never commit.
// Article texts are examples only; the linked records are real published ones.

export type NewsTopic = 'welcome' | 'support' | 'opening' | 'closing' | 'site'

export interface SampleNews {
  slug: string
  date: string
  topic: NewsTopic
  title: string
  summary: string
  image?: string
}

export const TOPIC_LABELS: Record<NewsTopic, string> = {
  welcome: 'Neu im Archiv',
  support: 'Förderung',
  opening: 'Eröffnung',
  closing: 'Rundgang folgt',
  site: 'Website'
}

export const useSampleNews = () => {
  const { venues, venueExhibitions, persons, organisations, sponsorPages } = useArchiveData()

  const linked = computed(() => ({
    venues: venues.value.slice(0, 2),
    exhibitions: venueExhibitions.value.slice(0, 2),
    persons: persons.value.slice(0, 2),
    organisations: organisations.value.slice(0, 1),
    sponsors: sponsorPages.value.slice(0, 1)
  }))

  const news = computed<SampleNews[]>(() => {
    const [v1, v2] = venues.value
    const [e1, e2, e3] = venueExhibitions.value
    return [
      { slug: 'neue-galerien', date: '2026-11-03', topic: 'welcome', title: `${v1?.name ?? 'Galerie A'} und ${v2?.name ?? 'Galerie B'}`, summary: 'Zwei Ausstellungsorte sind neu im Archiv, mit Adresse, Karte und ihren Ausstellungen.', image: v1?.image },
      { slug: 'rundgang-folgt', date: '2026-11-01', topic: 'closing', title: `„${e1?.title ?? 'Ausstellung'}“ schließt am 19. Dezember`, summary: 'Danach ist die Ausstellung als 360°-Rundgang online.', image: e1?.image },
      { slug: 'eroeffnung', date: '2026-10-28', topic: 'opening', title: `„${e2?.title ?? 'Ausstellung'}“ eröffnet am 14. November`, summary: 'Vernissage um 19 Uhr, die Ausstellung läuft bis Ende Jänner.', image: e2?.image },
      { slug: 'in-der-naehe', date: '2026-10-15', topic: 'site', title: 'Ausstellungen in der Nähe finden', summary: 'Die Suche zeigt Galerien und laufende Ausstellungen im Umkreis, die nächsten zuerst.' },
      { slug: 'foerderung', date: '2026-10-02', topic: 'support', title: `${sponsorPages.value[0]?.title ?? 'Ein Sponsor'} fördert das Archiv`, summary: 'Die Förderung gilt den 360°-Rundgängen des Jahres 2027.' },
      { slug: 'tags', date: '2026-09-20', topic: 'site', title: 'Filter nach Technik und Thema', summary: 'Ausstellungen lassen sich nach Malerei, Fotografie, Skulptur und weiteren Begriffen filtern.', image: e3?.image },
      { slug: 'kuenstlerinnen', date: '2025-12-12', topic: 'welcome', title: `${persons.value[0]?.name ?? 'Künstlerin'} und ${persons.value[1]?.name ?? 'Künstler'}`, summary: 'Zwei Künstler:innen sind neu im Archiv, mit Biografie und Ausstellungen.' }
    ]
  })

  return { news, linked }
}

export const formatNewsDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-AT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
