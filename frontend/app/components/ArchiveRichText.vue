<script setup lang="ts">
import { sanitizeRichText } from '~/utils/richText'

// Rich text from a Directus WYSIWYG field. Sanitised again here, so no caller can hand
// unsafe HTML to v-html; `.prose` (docs/STYLE_GUIDE.md, CMS rich text) styles paragraphs and lists.
const props = defineProps<{
  html: string
}>()

const safeHtml = computed(() => sanitizeRichText(props.html))
</script>

<template>
  <div
    class="[ archive-rich-text ] prose max-w-176 text-button leading-[1.58] text-archive-body prose-p:text-archive-body prose-li:text-archive-body prose-strong:font-medium prose-strong:text-archive-ink compact:text-base compact:leading-normal"
    v-html="safeHtml"
  />
</template>
