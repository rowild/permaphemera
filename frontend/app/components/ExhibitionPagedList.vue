<script setup lang="ts">
import { pageFromQuery, paginate } from '~/utils/pagination'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// A long exhibition list cut into pages: search results and the group pages.
// The page number lives in the address (`?page=2`), so every page can be linked.
const props = withDefaults(defineProps<{
  exhibitions: ResolvedExhibition[]
  /** Id of the list's top; the pager links jump here. */
  anchor: string
  perPage?: number
}>(), {
  perPage: 20
})

const route = useRoute()
const shown = computed(() => paginate(props.exhibitions, pageFromQuery(route.query.page), props.perPage))
</script>

<template>
  <div :id="props.anchor" class="[ exhibition-paged-list ] scroll-mt-32 compact:scroll-mt-20">
    <div class="grid grid-cols-2 gap-3 compact:gap-2.5">
      <ExhibitionCard
        v-for="exhibition in shown.items"
        :key="exhibition.id"
        :exhibition="exhibition"
        layout="side"
      />
    </div>
    <ArchivePager :page="shown.page" :page-count="shown.pageCount" :anchor="props.anchor" />
  </div>
</template>
