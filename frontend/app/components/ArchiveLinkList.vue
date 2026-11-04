<script setup lang="ts">
// Names joined by commas, each a link: a page of the site (`to`, locale-neutral) or another site
// (`href`, new tab).
const props = defineProps<{
  items: Array<{ label: string, to?: string, href?: string }>
}>()

const localePath = useLocalePath()
</script>

<template>
  <span class="[ link-list ]">
    <template v-for="(item, index) in props.items" :key="`${item.to ?? item.href}-${index}`"><template v-if="index">, </template><ArchiveTextLink v-if="item.href" :href="item.href" target="_blank" rel="noreferrer" icon-motion="external">{{ item.label }}</ArchiveTextLink><ArchiveTextLink v-else :to="localePath(item.to ?? '/')">{{ item.label }}</ArchiveTextLink></template>
  </span>
</template>
