<script setup lang="ts">
import { markSources, sanitizeRichText } from '~/utils/richText'

// Rich text from a Directus WYSIWYG field. Sanitised again here, so no caller can hand
// unsafe HTML to v-html; `.prose` (docs/STYLE_GUIDE.md, CMS rich text) styles paragraphs and lists.
// A closing "Quellen" paragraph with its list becomes the source block (owner, 2026-11-06).
// Links work in every text (owner, 2026-11-09); a site link routes in the app.
const props = withDefaults(defineProps<{
  html: string
  /** `lead`: the larger text of the exhibition description. */
  size?: 'body' | 'lead'
}>(), {
  size: 'body'
})

const localePath = useLocalePath()
// A site link in a text is written without language; it opens in the current one.
const safeHtml = computed(() => markSources(sanitizeRichText(props.html, { localize: (path) => localePath(path) })))

const sizeClass = computed(() => props.size === 'lead'
  ? 'max-w-3xl text-lg leading-[1.65] compact:leading-normal'
  : 'max-w-176 text-button leading-[1.58] compact:leading-normal')

// A link to a page of the site changes the route instead of reloading the app.
const followSiteLink = (event: MouseEvent) => {
  const anchor = (event.target as HTMLElement | null)?.closest('a')
  const href = anchor?.getAttribute('href')
  if (!href?.startsWith('/') || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  event.preventDefault()
  void navigateTo(href)
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- sanitizeRichText above keeps only safe tags and links -->
  <div
    class="[ archive-rich-text ] archive-cms-text prose text-archive-body prose-p:text-archive-body prose-li:text-archive-body prose-strong:font-medium prose-strong:text-archive-ink compact:text-base"
    :class="sizeClass"
    @click="followSiteLink"
    v-html="safeHtml"
  />
</template>
