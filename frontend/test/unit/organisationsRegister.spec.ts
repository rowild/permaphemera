import { describe, expect, it } from 'vitest'
import { CURATOR_ROLES, ORGANISER_ROLES, isRegisterOrganisation, personsInRoles } from '~/utils/organisationsRegister'
import type { ResolvedOrganisation } from '~/utils/resolveOrganisations'
import type { ResolvedPerson } from '~/utils/resolvePersons'

const organisation = (overrides: Partial<ResolvedOrganisation>): ResolvedOrganisation => ({
  id: 'o', slug: 'o', title: 'O', kind: 'institution', websites: [], venues: [], members: [], records: [], ...overrides
}) as ResolvedOrganisation

const person = (slug: string, roles: string[]): ResolvedPerson => ({
  id: slug, slug, name: slug, roles: roles.map((role) => ({ slug: role, title: role })), isArtist: roles.includes('artist'),
  links: [], memberships: [], venues: [], records: [], statements: []
}) as ResolvedPerson

describe('isRegisterOrganisation', () => {
  it('lists an organisation that stood behind an exhibition', () => {
    expect(isRegisterOrganisation(organisation({ records: [{ id: 'e' } as never] }))).toBe(true)
  })

  it('lists an organisation that runs a gallery, but not one that only exhibits there', () => {
    expect(isRegisterOrganisation(organisation({ venues: [{ slug: 'v', name: 'V', relation: 'runs' }] }))).toBe(true)
    expect(isRegisterOrganisation(organisation({ venues: [{ slug: 'v', name: 'V', relation: 'exhibits_at' }] }))).toBe(false)
  })

  it('lists every group: association, federation, collective, initiative', () => {
    for (const kind of ['association', 'federation', 'collective', 'initiative']) {
      expect(isRegisterOrganisation(organisation({ kind }))).toBe(true)
    }
  })

  it('leaves out an institution or company with no exhibition and no gallery', () => {
    expect(isRegisterOrganisation(organisation({ kind: 'institution' }))).toBe(false)
    expect(isRegisterOrganisation(organisation({ kind: 'company' }))).toBe(false)
  })
})

describe('personsInRoles', () => {
  const persons = [person('zora', ['artist']), person('gerhard', ['organiser']), person('anna', ['board', 'artist']), person('cura', ['curator'])]

  it('puts organisers and board members together, curators apart, artists nowhere', () => {
    expect(personsInRoles(persons, ORGANISER_ROLES).map((p) => p.slug)).toEqual(['anna', 'gerhard'])
    expect(personsInRoles(persons, CURATOR_ROLES).map((p) => p.slug)).toEqual(['cura'])
  })
})
