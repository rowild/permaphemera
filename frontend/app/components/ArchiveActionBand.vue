<script setup lang="ts">
// The closing band of a text page: eyebrow, title with its red accent, an optional note (default
// slot) and the buttons (#actions).
const props = defineProps<{
  titleId: string
  eyebrow: string
  title: string
  accent: string
}>()
</script>

<template>
  <section class="[ action-band ] [ section-band ] mx-auto grid max-w-band grid-cols-[minmax(0,1fr)_auto] items-center gap-10 px-gutter py-[clamp(3rem,5vw,5rem)] compact:grid-cols-1 compact:gap-5 compact:px-4 compact:py-5" :aria-labelledby="props.titleId">
    <div>
      <p class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">{{ props.eyebrow }}</p>
      <ArchiveSectionHeading :id="props.titleId" class="max-w-192">
        {{ props.title }} <span class="text-archive-red">{{ props.accent }}</span>
      </ArchiveSectionHeading>
      <p v-if="$slots.default" class="mt-4 mb-0 max-w-152 font-display text-base leading-relaxed text-archive-muted">
        <slot />
      </p>
    </div>
    <div class="[ action-band-links ] flex flex-wrap justify-end gap-4 compact:justify-start compact:gap-3">
      <slot name="actions" />
    </div>
  </section>
</template>
