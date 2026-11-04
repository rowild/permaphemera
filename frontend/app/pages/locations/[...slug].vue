<script setup lang="ts">
// Galleries were called "locations" until 2026-09: old links go to the gallery of the same slug,
// in the same language. A route record redirect, so it also works in this browser-only app
// (nginx answers the same paths with a real 301 for search engines).
definePageMeta({
  redirect: (to) => to.path.replace(/\/locations(?:\/(.*?))?\/?$/, (_, slug: string | undefined) => (slug ? `/venues/${slug}/` : '/venues/'))
})
</script>

<template>
  <div />
</template>
