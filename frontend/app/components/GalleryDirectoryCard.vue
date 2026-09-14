<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ResolvedVenue } from '~/utils/resolveVenues'
import { createDirectoryImageTransform, createOrnamentTransform } from '~/utils/seededLayout'

const props = withDefaults(defineProps<{
  venue: ResolvedVenue
  index: number
  recordCount?: number
  featured?: boolean
}>(), {
  recordCount: 0,
  featured: false
})

const active = ref(false)
const localePath = useLocalePath()
const imageTransform = computed(() => createDirectoryImageTransform(props.venue.id))
const ornament = computed(() => createOrnamentTransform(`gallery-directory:${props.venue.id}`, props.featured))
const imageStyle = computed<CSSProperties>(() => ({
  transform: active.value ? imageTransform.value.active : imageTransform.value.rest
}))
const ornamentStyle = computed<CSSProperties>(() => ({
  right: ornament.value.right,
  bottom: ornament.value.bottom,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
const sequence = computed(() => props.venue.archive_number || String(props.index + 1).padStart(2, '0'))
</script>

<template>
  <NuxtLink
    class="[ gallery-directory-card ] group/venue relative min-w-0 overflow-visible rounded-none border-0 bg-transparent p-2 text-archive-ink no-underline filter-[drop-shadow(0_0.5rem_0.55rem_rgba(75,52,29,0.1))] isolate [transition:filter_0.38s_ease,translate_0.38s_var(--ease-archive-lift)] hover:translate-y-[-0.18rem] hover:filter-[drop-shadow(0_0.75rem_0.75rem_rgba(75,52,29,0.17))] focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red compact:p-1 motion-reduce:transition-none"
    :class="props.featured ? '[ gallery-directory-card-featured ] col-span-2 min-h-124 tablet:min-h-104 compact:min-h-0' : 'min-h-116 compact:min-h-0'"
    :to="localePath(`/venues/${props.venue.slug}/`)"
    :aria-label="$t('galleries.openGallery', { name: props.venue.name })"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @focus="active = true"
    @blur="active = false"
  >
    <div
      class="[ gallery-directory-card-content ] relative z-2 grid h-full min-w-0"
      :class="props.featured ? 'grid-cols-[minmax(24rem,1.15fr)_minmax(20rem,0.85fr)] tablet:grid-cols-2 compact:grid-cols-1' : 'grid-rows-[15rem_1fr] compact:grid-rows-[7.5rem_1fr]'"
    >
      <div class="[ gallery-directory-card-media ] relative min-w-0 overflow-visible p-3 compact:p-2" :class="props.featured ? 'compact:pb-0' : ''">
        <VenueMaskedImage
          class="size-full transition-transform duration-460 ease-archive-lift motion-reduce:transition-none"
          :style="imageStyle"
          :src="props.venue.image"
          :alt="props.venue.image_alt"
          shape="frame"
        />
        <span class="absolute top-5 left-5 z-3 bg-archive-paper/88 px-2 py-1 text-xs tracking-widest text-archive-red compact:top-3 compact:left-3 compact:px-1.5 compact:py-0.5 compact:text-3xs" aria-hidden="true">{{ sequence }}</span>
      </div>

      <div class="[ gallery-directory-card-copy ] relative z-2 flex min-w-0 flex-col px-6 pt-5 pb-6 compact:px-3 compact:pt-2 compact:pb-4">
        <p class="m-0 flex items-center gap-2 text-xs tracking-widest text-archive-red uppercase compact:text-3xs">
          <span>{{ props.venue.state }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ props.venue.postal_code }}</span>
        </p>
        <h3 class="mt-2 mb-0 font-display font-normal leading-none" :class="props.featured ? 'text-h2 compact:text-3xl' : 'text-h3-sm compact:text-base'">{{ props.venue.name }}</h3>
        <p class="mt-1 mb-0 text-button text-archive-muted compact:text-xs">{{ props.venue.city_name }}</p>
        <p class="mt-5 mb-5 max-w-152 flex-auto text-button leading-[1.55] text-archive-body compact:hidden">{{ props.venue.description }}</p>
        <div class="mt-auto flex items-end justify-between gap-4 border-t border-archive-rule-warm/22 pt-4 compact:pt-2">
          <p class="m-0 text-xs tracking-wider text-archive-muted uppercase compact:text-3xs">
            {{ props.recordCount ? $t('galleries.recordCount', props.recordCount) : $t('galleries.profileOnly') }}
          </p>
          <span class="flex shrink-0 items-center gap-2 text-archive-red compact:gap-1 compact:text-xs">
            <span class="compact:hidden">{{ $t('galleries.open') }}</span>
            <ArchiveArrow class="w-6 compact:w-5" />
          </span>
        </div>
      </div>
    </div>
    <VenueCardFrame />
    <span
      class="[ gallery-directory-card-ornament ] archive-crosshair-ornament pointer-events-none absolute z-3 size-20 opacity-50 transition-[transform,translate,scale,rotate,opacity] duration-460 ease-archive-lift compact:size-12 motion-reduce:transition-none"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
