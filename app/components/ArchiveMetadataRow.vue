<script setup lang="ts">
type MetadataRowVariant = 'exhibition' | 'location'

defineProps<{
  label: string
  variant: MetadataRowVariant
}>()

const rowClasses: Record<MetadataRowVariant, string> = {
  exhibition: 'grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-4 border-b border-archive-rule-warm/20 py-[0.72rem] compact:grid-cols-[6.5rem_minmax(0,1fr)] compact:gap-2 compact:py-2',
  location: 'grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 border-t border-archive-rule-warm/22 py-[0.65rem] compact:grid-cols-[6.5rem_minmax(0,1fr)] compact:gap-2 compact:py-2',
}

const termClasses: Record<MetadataRowVariant, string> = {
  exhibition: 'grid grid-cols-[1.125rem_minmax(0,1fr)] items-baseline gap-2 text-[0.78rem] leading-5 tracking-[0.06em] text-archive-red uppercase compact:text-[0.68rem]',
  location: 'm-0 flex items-center gap-[0.45rem] text-[0.84rem] text-archive-red uppercase compact:text-[0.68rem]',
}

const valueClasses: Record<MetadataRowVariant, string> = {
  exhibition: 'm-0 leading-5 text-archive-copy compact:text-sm',
  location: 'm-0 text-archive-copy compact:text-sm compact:leading-tight',
}

const iconClasses: Record<MetadataRowVariant, string> = {
  exhibition: '[ metadata-icon ] self-center leading-none [&>svg]:block',
  location: '[ metadata-icon ] flex items-center leading-none [&>svg]:block',
}
</script>

<template>
  <div class="[ archive-metadata-row ]" :class="rowClasses[variant]">
    <dt :class="termClasses[variant]">
      <span :class="iconClasses[variant]"><slot name="icon" /></span>
      <span class="[ metadata-label ]">{{ label }}</span>
    </dt>
    <dd :class="valueClasses[variant]"><slot /></dd>
  </div>
</template>
