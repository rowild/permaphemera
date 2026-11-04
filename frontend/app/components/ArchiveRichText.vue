<script setup lang="ts">
import { sanitizeRichText } from '~/utils/richText'

// Rich text from a Directus WYSIWYG field. Sanitised again here, so no caller can hand
// unsafe HTML to v-html; `.prose` (docs/STYLE_GUIDE.md, CMS rich text) styles paragraphs and lists.
const props = defineProps<{
  html: string
  /** Keep links to site pages and https addresses (news articles); site links route in the app. */
  links?: boolean
}>()

const safeHtml = computed(() => sanitizeRichText(props.html, { links: props.links }))

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
    class="[ archive-rich-text ] prose max-w-176 text-button leading-[1.58] text-archive-body prose-p:text-archive-body prose-li:text-archive-body prose-strong:font-medium prose-strong:text-archive-ink compact:text-base compact:leading-normal"
    @click="followSiteLink"
    v-html="safeHtml"
  />
</template>
