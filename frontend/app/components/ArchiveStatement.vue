<script setup lang="ts">
// An artist's statement: the question it answers (prompt), the text, and a caption (slot) that
// names the artist or the exhibition.
const props = withDefaults(defineProps<{ prompt?: string | null, text: string }>(), { prompt: undefined })
</script>

<template>
  <figure class="[ statement ] m-0 border-l border-archive-red/42 py-1 pl-6 not-last:mb-8 compact:pl-4 compact:not-last:mb-6">
    <p v-if="props.prompt" class="m-0 mb-2 text-sm tracking-[0.04em] text-archive-red">{{ props.prompt }}</p>
    <blockquote class="m-0 font-display text-xl leading-normal text-archive-ink compact:text-lg">{{ props.text }}</blockquote>
    <figcaption class="mt-3 text-sm text-archive-muted"><slot /></figcaption>
  </figure>
</template>
