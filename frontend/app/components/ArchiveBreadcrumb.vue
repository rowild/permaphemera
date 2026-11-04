<script setup lang="ts">
// Every breadcrumb of the site: the start page first (always), then the items, the last one the
// current page (aria-current, no link). Paths are locale-neutral ('/venues/'); the component
// adds the language.
const props = withDefaults(defineProps<{
  items: Array<{ label: string, to?: string }>
  /** 'night' on the dark exhibition hero. */
  surface?: 'paper' | 'night'
}>(), {
  surface: 'paper'
})

const { t } = useI18n()
const localePath = useLocalePath()
const crumbs = computed(() => [{ label: t('navigation.archive'), to: '/' }, ...props.items])
</script>

<template>
  <nav
    class="[ breadcrumb ] mb-10 flex flex-wrap gap-[0.55rem] text-sm text-archive-muted compact:mb-4 compact:gap-2 compact:text-sm"
    :aria-label="$t('common.breadcrumb')"
  >
    <template v-for="(crumb, index) in crumbs" :key="index">
      <span v-if="index" aria-hidden="true">/</span>
      <ArchiveTextLink v-if="crumb.to && index < crumbs.length - 1" :to="localePath(crumb.to)" :surface="props.surface">{{ crumb.label }}</ArchiveTextLink>
      <span v-else :aria-current="index === crumbs.length - 1 ? 'page' : undefined" :class="{ 'text-archive-night-heading': props.surface === 'night' }">{{ crumb.label }}</span>
    </template>
  </nav>
</template>
