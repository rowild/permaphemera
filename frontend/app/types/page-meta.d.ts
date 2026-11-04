import type { NavActive } from '~/types/navigation'

declare module '#app' {
  interface PageMeta {
    /** The main menu item the page belongs to (layouts/default.vue marks it). */
    navActive?: NavActive
    /** The page renders before the archive has arrived (the start page). */
    archiveOptional?: boolean
  }
}

export {}
