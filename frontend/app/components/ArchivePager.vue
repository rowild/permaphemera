<script setup lang="ts">
import { pagerSlots } from '~/utils/pagination'

// Numbered pages under a long list. Each link keeps the rest of the query (a search)
// and jumps to `anchor`, so the next page starts at the top of the list, not at the pager.
const props = defineProps<{
  page: number
  pageCount: number
  /** Id of the element at the top of the list. */
  anchor: string
}>()

const route = useRoute()
const slots = computed(() => pagerSlots(props.page, props.pageCount))
const linkTo = (page: number) => ({
  query: { ...route.query, page: page > 1 ? String(page) : undefined },
  hash: `#${props.anchor}`
})
// The router calls a link "current" when only its query differs, so every pager link
// would get aria-current="page". Passing undefined removes it; only the plain span is current.
const notCurrent = undefined
const controlClass = 'inline-flex min-h-11 min-w-11 items-center justify-center px-2 no-underline transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red'
</script>

<template>
  <nav v-if="props.pageCount > 1" class="[ archive-pager ] mt-10 flex flex-wrap items-center justify-center gap-1 font-display text-eyebrow compact:mt-6 compact:text-sm" :aria-label="$t('pager.label')">
    <NuxtLink v-if="props.page > 1" :class="controlClass" class="text-archive-red/86 hover:text-archive-ink" :to="linkTo(props.page - 1)" :aria-current="notCurrent" rel="prev" :aria-label="$t('pager.previous')">
      <ArchiveArrow class="w-8" direction="left" />
    </NuxtLink>
    <template v-for="(slot, index) in slots" :key="slot ?? `gap-${index}`">
      <span v-if="slot === null" class="px-1 text-archive-muted" aria-hidden="true">…</span>
      <span v-else-if="slot === props.page" :class="controlClass" class="border border-archive-red/42 text-archive-red" aria-current="page">{{ slot }}</span>
      <NuxtLink v-else :class="controlClass" class="text-archive-copy hover:text-archive-red" :to="linkTo(slot)" :aria-current="notCurrent" :aria-label="$t('pager.page', { page: slot })">{{ slot }}</NuxtLink>
    </template>
    <NuxtLink v-if="props.page < props.pageCount" :class="controlClass" class="text-archive-red/86 hover:text-archive-ink" :to="linkTo(props.page + 1)" :aria-current="notCurrent" rel="next" :aria-label="$t('pager.next')">
      <ArchiveArrow class="w-8" />
    </NuxtLink>
  </nav>
</template>
