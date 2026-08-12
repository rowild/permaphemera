<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ResolvedVenue } from '~/utils/resolveVenues'
import { createOrnamentTransform } from '~/utils/seededLayout'

// Only fed from app/pages/index.vue's `directoryVenues`, a landing-page card
// projection built from ResolvedVenue — not the full resolved record itself
// (it also carries a `location_id` field ResolvedVenue doesn't have). Picking
// just the fields this card reads keeps the prop type honest about what it
// actually needs and what its one call site actually supplies.
const props = withDefaults(defineProps<{
  venue: Pick<ResolvedVenue, 'id' | 'slug' | 'name' | 'image' | 'city'>
  featured?: boolean
}>(), {
  featured: false
})

const active = ref(false)
const ornament = computed(() => createOrnamentTransform(props.venue.id, props.featured))
const ornamentStyle = computed<CSSProperties>(() => ({
  right: ornament.value.right,
  bottom: ornament.value.bottom,
  transform: active.value ? ornament.value.active : ornament.value.rest
}))
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    class="[ venue-card ] group/venue relative flex cursor-pointer flex-col overflow-hidden rounded-none border-0 bg-transparent p-2 shadow-none filter-[drop-shadow(0_0.5rem_0.55rem_rgba(75,52,29,0.11))] isolate [transition:filter_0.38s_ease,translate_0.38s_var(--ease-archive-lift)] hover:translate-y-[-0.18rem] hover:filter-[drop-shadow(0_0.72rem_0.72rem_rgba(75,52,29,0.18))] focus-visible:outline-1 focus-visible:outline-offset-[0.3rem] focus-visible:outline-archive-red/72 motion-reduce:transition-none compact:p-1"
    :class="props.featured ? '[ venue-card-featured ] row-span-2 tablet:col-span-full tablet:row-auto compact:col-span-1 compact:row-auto' : 'min-h-90 compact:min-h-0'"
    :to="localePath(`/locations/${props.venue.slug}/`)"
    :aria-label="$t('cards.openVenue', { name: props.venue.name })"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @focus="active = true"
    @blur="active = false"
  >
    <span class="[ venue-card-media ] relative z-1 block overflow-hidden leading-0 shadow-none">
      <VenueMaskedImage
        :class="props.featured ? 'h-[clamp(25rem,36vw,31rem)] compact:h-32' : 'h-49 compact:h-32'"
        :src="props.venue.image"
        :alt="props.venue.name"
        interactive
      />
    </span>
    <div
      class="[ venue-card-body ] relative z-3 flex flex-auto flex-col px-4 pb-4 compact:px-2 compact:pb-4"
      :class="props.featured ? 'pt-[1.95rem] compact:pt-2' : 'pt-[1.2rem] compact:pt-2'"
    >
      <h3 class="m-0 font-display text-h4 leading-[1.08] font-medium compact:text-base">{{ props.venue.name }}</h3>
      <p class="mt-[0.2rem] mb-5 flex-auto text-archive-muted compact:mb-1 compact:text-xs">{{ props.venue.city }}</p>
      <span v-if="props.featured" class="[ venue-card-divider ] archive-venue-card-divider mt-auto block h-[0.7rem] w-[min(15rem,68%)] opacity-68 compact:hidden" aria-hidden="true" />
      <span class="[ venue-card-link ] mt-auto mb-[0.4rem] flex items-center gap-2 font-display text-button text-archive-red compact:mb-1 compact:gap-1 compact:text-xs">
        {{ $t('cards.openArchive') }} <ArchiveArrow class="w-[1.65rem] compact:w-5" />
      </span>
    </div>
    <VenueCardFrame />
    <span
      class="[ venue-card-ornament ] archive-crosshair-ornament pointer-events-none absolute z-2 shadow-none transition-[transform,translate,scale,rotate,opacity] duration-460 ease-archive-lift motion-reduce:transition-none"
      :class="props.featured ? 'size-29 opacity-66 compact:size-16' : 'size-[5.4rem] opacity-62 compact:size-14'"
      :style="ornamentStyle"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
