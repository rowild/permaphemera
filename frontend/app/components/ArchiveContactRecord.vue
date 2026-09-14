<script setup lang="ts">
interface ContactRecordItem {
  label: string
  value: string
  href?: string
}

const props = defineProps<{
  label: string
  recordAria: string
  items: ContactRecordItem[]
}>()
</script>

<template>
  <aside class="[ contact-record ] relative self-center border-y border-archive-rule-warm/28 py-5 tablet:max-w-180 compact:py-4" :aria-label="props.recordAria">
    <img class="absolute right-2 bottom-2 h-auto w-24 opacity-12" src="/media/images/landing/method/details/archive-stamp.png" alt="" aria-hidden="true">
    <p class="relative m-0 mb-4 font-display text-xs font-medium tracking-widest text-archive-red uppercase compact:mb-3">
      {{ props.label }}
    </p>
    <address class="relative not-italic">
      <dl class="m-0 grid gap-2.5">
        <div v-for="item in props.items" :key="`${item.label}-${item.value}`" class="grid grid-cols-[minmax(7rem,0.42fr)_minmax(0,1fr)] items-baseline gap-4 compact:grid-cols-1 compact:items-stretch compact:gap-1">
          <dt class="font-display text-xs tracking-widest text-archive-muted uppercase">{{ item.label }}</dt>
          <dd class="m-0 font-display text-base leading-snug text-archive-copy">
            <ArchiveTextLink v-if="item.href" :href="item.href">{{ item.value }}</ArchiveTextLink>
            <template v-else>{{ item.value }}</template>
          </dd>
        </div>
      </dl>
    </address>
  </aside>
</template>
