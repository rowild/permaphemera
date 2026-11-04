<script setup lang="ts">
import type { LegalRecordItem } from '~/types/legal'

// The fact box beside a text-page title: the contact data (`address`, with the archive `stamp`) on
// the contact page, the document note on the legal pages. On phones label and value stack: long
// labels ("Kontaktperson", "Verantwortlich") ran into the value in two columns.
const props = withDefaults(defineProps<{
  label: string
  recordAria: string
  items: LegalRecordItem[]
  address?: boolean
  stamp?: boolean
}>(), {
  address: false,
  stamp: false
})
</script>

<template>
  <aside class="[ fact-record ] relative self-center border-y border-archive-rule-warm/28 py-5 tablet:max-w-180 compact:py-4" :aria-label="props.recordAria">
    <img v-if="props.stamp" class="absolute right-2 bottom-2 h-auto w-24 opacity-12" src="/media/images/landing/method/details/archive-stamp.png" alt="" aria-hidden="true">
    <p class="relative m-0 mb-4 font-display text-xs font-medium tracking-widest text-archive-red uppercase compact:mb-3">{{ props.label }}</p>
    <component :is="props.address ? 'address' : 'div'" class="relative not-italic">
      <dl class="m-0 grid gap-3">
        <div v-for="item in props.items" :key="`${item.label}-${item.value}`" class="grid grid-cols-[minmax(7rem,0.42fr)_minmax(0,1fr)] items-baseline gap-4 compact:grid-cols-1 compact:items-stretch compact:gap-1">
          <dt class="font-display text-xs tracking-widest text-archive-muted uppercase">{{ item.label }}</dt>
          <dd class="m-0 font-display text-base leading-snug text-archive-copy">
            <ArchiveTextLink v-if="item.href" :href="item.href">{{ item.value }}</ArchiveTextLink>
            <template v-else>{{ item.value }}</template>
          </dd>
        </div>
      </dl>
    </component>
  </aside>
</template>
