<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  src: string
  alt: string
}>()
</script>

<template>
  <div class="[ framed-archive-image ] relative filter-[drop-shadow(0_1.1rem_1.25rem_rgba(69,46,24,0.18))] isolate" v-bind="$attrs">
    <VenueMaskedImage class="relative z-1 size-full" :src="src" :alt="alt" shape="frame" />
    <VenueCardFrame />
  </div>
</template>
