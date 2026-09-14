<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { createPaperStackTransforms } from '~/utils/seededLayout'

interface ArchivePaperStackItem {
  id: string
  image?: string
  alt?: string
}

const props = withDefaults(defineProps<{
  stackId: string
  items: ArchivePaperStackItem[]
  label: string
  variant?: 'artist' | 'venue'
  to?: string
}>(), {
  variant: 'artist',
  to: undefined
})

const expanded = ref(false)
const rootElement = computed(() => props.to ? resolveComponent('NuxtLink') : 'article')
const transforms = computed(() => createPaperStackTransforms(
  props.stackId,
  props.items.map((item) => item.id),
  props.variant
))

const rootClasses = {
  artist: 'relative mt-[2.2rem] block h-46 w-full overflow-visible font-display text-title leading-[1.1] text-archive-red shadow-none filter-none tablet:max-w-96',
  venue: 'group/venue col-start-4 row-start-2 z-1 mt-0 h-53 min-h-0 rotate-[1.5deg] self-center justify-self-stretch overflow-visible border-0 bg-transparent p-0 shadow-none filter-none isolate origin-center will-change-transform tablet:col-auto tablet:row-auto tablet:rotate-none compact:col-span-2 compact:mt-10 compact:h-40 compact:w-full compact:max-w-40 compact:justify-self-center'
} as const

const paperclipClasses = {
  artist: 'top-[-2.3rem] right-2 size-[4.3rem]',
  venue: 'top-[-2.9rem] right-[0.95rem] size-[4.8rem] compact:-top-7 compact:right-1 compact:size-12'
} as const

const labelClasses = {
  artist: 'flex w-3/4 items-center justify-center gap-[0.55rem] text-center shadow-none',
  venue: 'archive-button-primary-frame inline-flex h-[3.55rem] min-h-[3.55rem] w-32 min-w-32 items-center justify-center rounded-none border-12 border-transparent bg-transparent px-3 font-display text-eyebrow font-normal whitespace-nowrap text-archive-light-ink shadow-none transition-[filter,transform,translate,scale,rotate] duration-[0.38s,0.14s] ease-[ease,cubic-bezier(0.4,0,0.2,1)] hover:brightness-109 hover:contrast-102 hover:saturate-108 active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red compact:h-12 compact:min-h-12 compact:w-24 compact:min-w-24 compact:px-2 compact:text-sm'
} as const

const sheetStyle = (index: number): CSSProperties => {
  const layout = transforms.value[index]

  return {
    zIndex: layout?.zIndex ?? index + 1,
    transform: expanded.value ? layout?.expanded : layout?.rest,
    transitionDelay: expanded.value ? layout?.delay : '0ms'
  }
}

const paperclipStyle = computed<CSSProperties>(() => ({
  transform: expanded.value ? 'translateY(-5px) rotate(5deg)' : 'translateY(0) rotate(0deg)'
}))

const handleFocusOut = (event: FocusEvent) => {
  const currentTarget = event.currentTarget as HTMLElement
  const nextTarget = event.relatedTarget

  if (!(nextTarget instanceof Node) || !currentTarget.contains(nextTarget)) {
    expanded.value = false
  }
}
</script>

<template>
  <component
    :is="rootElement"
    class="[ archive-paper-stack ]"
    :class="rootClasses[props.variant]"
    :to="props.to"
    :aria-label="props.label"
    @mouseenter="expanded = true"
    @mouseleave="expanded = false"
    @focusin="expanded = true"
    @focusout="handleFocusOut"
  >
    <span
      class="[ paperclip ] archive-venue-paperclip venue-paperclip-behind pointer-events-none absolute z-0 bg-archive-red shadow-none transition-transform duration-380 ease-archive-lift origin-[50%_70%] will-change-transform motion-reduce:transition-none"
      :class="paperclipClasses[props.variant]"
      :style="paperclipStyle"
      aria-hidden="true"
    />
    <span
      v-for="(item, index) in props.items"
      :key="item.id"
      class="[ paper-stack-sheet ] absolute inset-[0.55rem] block overflow-visible border-0 bg-transparent shadow-none filter-none isolate origin-center transition-transform duration-380 ease-archive-lift will-change-transform motion-reduce:transition-none"
      :style="sheetStyle(index)"
      aria-hidden="true"
    >
      <VenueMaskedImage
        v-if="item.image"
        class="relative z-1 size-full opacity-94 shadow-none"
        :src="item.image"
        :alt="item.alt ?? ''"
        shape="frame"
      />
      <VenueCardFrame />
    </span>
    <component
      :is="props.to ? 'span' : 'button'"
      class="[ paper-stack-label ] absolute top-1/2 left-1/2 z-8 -translate-1/2"
      :class="labelClasses[props.variant]"
      :type="props.to ? undefined : 'button'"
    >
      {{ props.label }}
      <ArchiveArrow v-if="props.variant !== 'venue'" class="w-[1.65rem]" />
    </component>
    <span
      class="[ paperclip ] archive-venue-paperclip venue-paperclip-front pointer-events-none absolute z-7 bg-archive-red shadow-none transition-transform duration-380 ease-archive-lift origin-[50%_70%] will-change-transform motion-reduce:transition-none"
      :class="paperclipClasses[props.variant]"
      :style="paperclipStyle"
      aria-hidden="true"
    />
  </component>
</template>
