import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'
import type { ResolvedPerson } from '~/utils/resolvePersons'

// The organisations page lists who organises: a gallery, an exhibition, or a group.
// A group (association, federation, collective, initiative) counts for what it is;
// an institution or company only when it runs a gallery or stood behind an exhibition.
const GROUP_KINDS = new Set(['association', 'federation', 'collective', 'initiative'])

export const isRegisterOrganisation = (organisation: ResolvedOrganisation): boolean =>
  organisation.records.length > 0
  || organisation.venues.some((venue) => venue.relation === 'runs')
  || GROUP_KINDS.has(organisation.kind)

/** Role slugs of the two people lists: board members organise their group. */
export const ORGANISER_ROLES = ['organiser', 'board'] as const
export const CURATOR_ROLES = ['curator'] as const

/** Persons holding any of the roles, by name. */
export const personsInRoles = (persons: ResolvedPerson[], roles: readonly string[]): ResolvedPerson[] =>
  persons
    .filter((person) => person.roles.some((role) => roles.includes(role.slug)))
    .sort((left, right) => left.name.localeCompare(right.name))
