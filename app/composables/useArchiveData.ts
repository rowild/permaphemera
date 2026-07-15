import artists from '~/data/artists.json'
import exhibitions from '~/data/exhibitions.json'
import locations from '~/data/locations.json'
import locationExhibitions from '~/data/location-exhibitions.json'
import sponsors from '~/data/sponsors.json'
import venues from '~/data/venues.json'
import deCommon from '~/data/translations/de/common.json'
import deExhibitions from '~/data/translations/de/exhibitions.json'
import deLocationExhibitions from '~/data/translations/de/location-exhibitions.json'
import deVenues from '~/data/translations/de/venues.json'
import type { Artist, Exhibition, Location, LocationExhibition, Sponsor, Venue } from '~/types/content'

type TranslationOverlay<T extends { id: string }> = Record<string, Partial<Omit<T, 'id'>>>

const translatePlace = (value: string, locale: string) => {
  if (locale !== 'de') return value
  return (deCommon.places as Record<string, string>)[value] ?? value
}

const applyOverlay = <T extends { id: string }>(records: T[], overlay: TranslationOverlay<T>): T[] =>
  records.map((record) => ({ ...record, ...(overlay[record.id] ?? {}) }))

export function useArchiveData() {
  const { locale } = useI18n()

  const artistsForLocale = computed(() => (artists as Artist[]).map((artist) => ({
    ...artist,
    location: translatePlace(artist.location, locale.value)
  })))

  const exhibitionsForLocale = computed(() => {
    const records = locale.value === 'de'
      ? applyOverlay(exhibitions as Exhibition[], deExhibitions as TranslationOverlay<Exhibition>)
      : exhibitions as Exhibition[]

    return records.map((exhibition) => ({
      ...exhibition,
      city: translatePlace(exhibition.city, locale.value)
    }))
  })

  const locationsForLocale = computed(() => (locations as Location[]).map((location) => ({
    ...location,
    state: translatePlace(location.state, locale.value),
    country: translatePlace(location.country, locale.value),
    description: location.translations.find((translation) => translation.languages_code === locale.value)?.description
      ?? location.translations.find((translation) => translation.languages_code === 'en')?.description
  })))

  const locationExhibitionsForLocale = computed(() => {
    const records = locale.value === 'de'
      ? applyOverlay(locationExhibitions as LocationExhibition[], deLocationExhibitions as TranslationOverlay<LocationExhibition>)
      : locationExhibitions as LocationExhibition[]

    return records.map((exhibition) => ({
      ...exhibition,
      city: translatePlace(exhibition.city, locale.value)
    }))
  })

  const venuesForLocale = computed(() => {
    const records = locale.value === 'de'
      ? applyOverlay(venues as Venue[], deVenues as TranslationOverlay<Venue>)
      : venues as Venue[]

    return records.map((venue) => ({
      ...venue,
      city: translatePlace(venue.city, locale.value)
    }))
  })

  return {
    artists: artistsForLocale,
    exhibitions: exhibitionsForLocale,
    locations: locationsForLocale,
    locationExhibitions: locationExhibitionsForLocale,
    sponsors: computed(() => sponsors as Sponsor[]),
    venues: venuesForLocale
  }
}
