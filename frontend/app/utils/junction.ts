import type { JunctionRow } from '~/types/content'

/**
 * The records one owner reaches through a junction table, in junction order (news → galleries,
 * sponsor → persons …). `byId` holds only published records, so drafts drop out here.
 */
export const linkedRecords = <T>(rows: JunctionRow[], ownerColumn: string, ownerId: string, column: string, byId: Map<string, T>): T[] => rows
  .filter((row) => row[ownerColumn] === ownerId)
  .sort((a, b) => a.sort - b.sort)
  .flatMap((row) => {
    const record = byId.get(String(row[column]))
    return record ? [record] : []
  })
