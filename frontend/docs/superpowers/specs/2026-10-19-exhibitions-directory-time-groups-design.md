# Exhibitions directory: time groups, group pages, image rule

Approved 2026-10-19.

## Why

The old `/exhibitions/` page listed every record newest-start first. Running
exhibitions sat somewhere in the middle, behind the upcoming ones, so the most
useful records were hard to reach. Records with only a placeholder image also
showed, with the placeholder as their picture.

## Decisions

1. **Only exhibitions with a real image render, everywhere.** `resolveExhibitions`
   drops a record whose image is missing or a `placeholder-…` file. It then shows on
   no list, venue, person, sponsor, organisation or artist page, and its own route is
   a 404. It appears as soon as it gets a real image. `has_image` left the resolved
   exhibition; the downstream filters that used it are gone.
2. **Overview without a search:** current exhibitions first (big `stacked` cards, three
   per row, two from the tablet breakpoint), then two columns: upcoming (soonest
   first) and past (most recently closed first), small `side` cards. One column from
   the tablet breakpoint, upcoming first.
3. **At most ten records per group.** A larger group ends in a link "All past
   exhibitions (15)" to its own page.
4. **Group pages** `/exhibitions/current/`, `/exhibitions/upcoming/`,
   `/exhibitions/past/` show only that group, twenty per page, with a numbered pager.
   No exhibition may use the slug `current`, `upcoming` or `past`
   (`pnpm check:directories` enforces it).
5. **Search** replaces the groups with one flat list of every match, newest start
   first, twenty per page, with the same pager. The page is in the address
   (`?page=2`); a new search starts at page 1.
6. **Pager:** at most seven slots (first, last, the pages around the current one,
   `…` for gaps); each link jumps to the top of its list.

## Parts

- `app/utils/exhibitionSchedule.ts` — `groupExhibitionsByTime` (all three groups, no
  limit); `selectExhibitionSchedule` now slices its result.
- `app/utils/pagination.ts` — `paginate`, `pageFromQuery`, `pagerSlots`.
- `app/components/ExhibitionTimeGroup.vue`, `ExhibitionPagedList.vue`,
  `ExhibitionGroupPage.vue`, `ArchivePager.vue`.
- `app/pages/exhibitions/{current,upcoming,past}.vue` — one line each.

## Deferred

- The intro block of `/exhibitions/` is unchanged. If current exhibitions should sit
  above it, that is a separate change.
