<script setup lang="ts">
import type { LocationExhibition } from '~/types/content'

const props = defineProps<{
  exhibition: LocationExhibition
  index: number
  selected: boolean
}>()

const emit = defineEmits<{
  select: [exhibition: LocationExhibition]
}>()
const localePath = useLocalePath()
</script>

<template>
  <li
    class="[ location-exhibition-record ] group/location-record relative border-t border-archive-rule-ledger/24 transition-colors duration-240 last:border-b last:border-archive-rule-ledger/24 motion-reduce:transition-none"
    :class="{ 'bg-[linear-gradient(90deg,rgb(var(--color-archive-red-rgb)/0.09),transparent_88%)]': props.selected }"
    @mouseenter="emit('select', props.exhibition)"
    @focusin="emit('select', props.exhibition)"
  >
    <span
      class="pointer-events-none absolute top-1/2 left-0 h-[calc(100%-1.4rem)] w-px -translate-y-1/2 bg-archive-red transition-[opacity,transform,translate,scale,rotate] duration-240 motion-reduce:transition-none"
      :class="props.selected ? 'scale-y-100 opacity-100' : 'scale-y-60 opacity-0'"
      aria-hidden="true"
    />
    <article class="grid grid-cols-[minmax(0,1fr)_3.2rem] items-stretch">
      <button
        class="[ location-exhibition-select ] grid min-h-[6.15rem] min-w-0 grid-cols-[2.6rem_minmax(0,1fr)] items-center gap-[0.9rem] border-0 bg-transparent py-3 pr-[0.7rem] pl-4 text-left text-inherit focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-archive-red compact:min-h-20 compact:grid-cols-[1.8rem_minmax(0,1fr)] compact:gap-2 compact:py-2 compact:pr-1 compact:pl-2"
        type="button"
        :aria-pressed="props.selected"
        :aria-label="$t('cards.previewExhibition', { title: props.exhibition.title })"
        @click="emit('select', props.exhibition)"
      >
        <span class="[ location-list-number ] mt-[0.2rem] self-start text-meta tracking-[0.08em] text-archive-red/62">{{ String(props.index + 1).padStart(2, '0') }}</span>
        <span class="[ location-list-copy ] grid min-w-0">
          <time class="text-2xs leading-[1.1] tracking-[0.07em] text-archive-muted uppercase" :datetime="props.exhibition.start_date">{{ props.exhibition.date_range }}</time>
          <strong class="my-[0.08rem] mt-[0.12rem] text-lede leading-[1.15] font-normal compact:text-base">{{ props.exhibition.title }}</strong>
          <small class="truncate pb-[0.16em] text-sm leading-[1.1] text-archive-red compact:text-xs">{{ props.exhibition.artist }}</small>
        </span>
      </button>
      <NuxtLink
        class="[ location-list-link ] flex items-center justify-center text-archive-red focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-archive-red"
        :to="localePath(`/exhibitions/${props.exhibition.slug}`)"
        :aria-label="$t('cards.openExhibitionFor', { title: props.exhibition.title })"
      >
        <span class="sr-only">{{ $t('cards.openExhibition') }}</span>
        <ArchiveArrow class="w-[1.65rem] group-hover/location-record:translate-x-[0.32rem] group-focus-within/location-record:translate-x-[0.32rem]" />
      </NuxtLink>
    </article>
  </li>
</template>
