export interface KaleidoscopeExhibitionItem {
  id: string
  /** What the blade opens: an exhibition with an open 360° tour, or (as a stop-gap) a gallery. */
  kind?: 'exhibition' | 'venue'
  image: string
  /** The exhibition page or the gallery page; a click on an exhibition blade opens `tourUrl` instead. */
  href: string
  /** Exhibition blades only: the open 360° tour the blade starts. */
  tourUrl?: string
  label: string
  title: string
  artist: string
  location: string
  dateRange: string
}
