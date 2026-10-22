<script setup lang="ts">
// The exhibition page's button into its 360° tour (useTourViewer holds the
// modal). The page renders this button only while the record is open (see
// utils/tourAccess); every other state is a status line, never a disabled
// button.
const props = defineProps<{
  tourUrl: string
}>()

const { opening, openTour } = useTourViewer()
const trigger = ref<{ $el?: HTMLElement } | null>(null)
</script>

<template>
  <ArchiveButton
    ref="trigger"
    type="button"
    :aria-busy="opening || undefined"
    @click="openTour(props.tourUrl, trigger?.$el)"
  >
    {{ opening ? $t('exhibition.openingExperience') : $t('exhibition.startExperience') }} <ArchiveArrow />
  </ArchiveButton>
</template>
