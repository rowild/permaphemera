export interface KaleidoscopeExhibitionItem {
  id: string
  /** What the blade opens: an exhibition with an open 360° tour, or (as a stop-gap) a gallery. */
  kind?: 'exhibition' | 'venue'
  image: string
  href: string
  label: string
  title: string
  artist: string
  location: string
  dateRange: string
}
