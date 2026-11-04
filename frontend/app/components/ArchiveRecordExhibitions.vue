<script setup lang="ts">
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

// The exhibitions of a record (person, organisation, event edition) as cards under an eyebrow and
// a section heading (default slot); without exhibitions, one muted sentence instead.
const props = defineProps<{
  titleId: string
  eyebrow: string
  items: Array<{ exhibition: ResolvedExhibition, label?: string, key?: string }>
  empty: string
}>()
</script>

<template>
  <section v-if="props.items.length" class="[ record-exhibitions ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5" :aria-labelledby="props.titleId">
    <div class="[ section-heading ] mb-10 compact:mb-5">
      <ArchiveEyebrow ornament="section">{{ props.eyebrow }}</ArchiveEyebrow>
      <ArchiveSectionHeading :id="props.titleId" class="max-w-232"><slot /></ArchiveSectionHeading>
    </div>
    <ExhibitionCardGrid :items="props.items" />
  </section>
  <section v-else class="[ record-exhibitions-empty ] [ section-band ] relative mx-auto max-w-band px-gutter py-[clamp(2rem,4vw,4rem)] compact:px-4 compact:py-4">
    <p class="m-0 max-w-176 text-button text-archive-muted compact:text-sm">{{ props.empty }}</p>
  </section>
</template>
