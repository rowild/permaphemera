<script setup lang="ts">
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// The grid of exhibition cards on organisation, person, sponsor and exhibition pages: three
// columns, two on tablets, one on phones; a role label above a card when the page has one.
const props = defineProps<{
  items: Array<{ exhibition: ResolvedExhibition, label?: string, key?: string }>
}>()
</script>

<template>
  <div class="[ exhibition-card-grid ] grid grid-cols-3 gap-6 tablet:grid-cols-2 compact:grid-cols-1">
    <div v-for="item in props.items" :key="item.key ?? item.exhibition.id" class="grid gap-2">
      <p v-if="item.label" class="m-0 text-xs tracking-widest text-archive-muted uppercase compact:text-3xs">{{ item.label }}</p>
      <ExhibitionCard :exhibition="item.exhibition" />
    </div>
  </div>
</template>
