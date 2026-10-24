<script setup lang="ts">
// One row of a register: a red meta line, the name, an optional intro line, a muted
// note and an "open" action. The whole row links to the record's page. Organisation,
// person and sponsor rows all use it, so the registers look and behave the same.
const props = withDefaults(defineProps<{
  to: string
  linkLabel: string
  title: string
  action: string
  meta?: string
  lede?: string
  note?: string
  // h4 when the row sits under an h3 sub-heading.
  heading?: 'h3' | 'h4'
}>(), {
  meta: undefined,
  lede: undefined,
  note: undefined,
  heading: 'h3'
})
</script>

<template>
  <article class="[ directory-row ] border-b border-archive-rule-warm/22 py-6 compact:py-4">
    <NuxtLink
      class="[ directory-row-link ] group/entry grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 text-inherit no-underline compact:grid-cols-1 compact:gap-2"
      :to="props.to"
      :aria-label="props.linkLabel"
    >
      <div class="min-w-0">
        <p v-if="props.meta" class="m-0 text-xs tracking-widest text-archive-red uppercase compact:text-3xs">{{ props.meta }}</p>
        <component :is="props.heading" class="[ directory-row-title ] mt-2 mb-0 font-display text-h3 font-normal leading-[1.15] text-archive-ink transition-colors duration-150 group-hover/entry:text-archive-red group-focus-visible/entry:text-archive-red compact:text-lg">{{ props.title }}</component>
        <p v-if="props.lede" class="mt-2 mb-0 max-w-176 text-button leading-[1.55] text-archive-body compact:text-sm compact:leading-normal">{{ props.lede }}</p>
        <p v-if="props.note" class="mt-3 mb-0 text-sm text-archive-muted compact:text-xs">{{ props.note }}</p>
      </div>
      <span class="[ directory-row-action ] mt-8 flex shrink-0 items-center gap-2 text-archive-red compact:mt-0 compact:text-sm">{{ props.action }} <ArchiveArrow class="w-6 compact:w-5" /></span>
    </NuxtLink>
  </article>
</template>
