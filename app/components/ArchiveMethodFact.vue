<script setup lang="ts">
defineProps<{
  label: string
  lines: string[]
  divider?: boolean
}>()
</script>

<template>
  <div class="[ method-fact ] relative min-w-0 px-[clamp(1.25rem,2.2vw,2.5rem)] py-1 compact:px-2 compact:py-2" :class="{ 'archive-method-fact-divider compact:after:hidden': divider }">
    <dt class="mb-[0.45rem] font-display text-xs tracking-widest text-archive-muted uppercase compact:mb-1 compact:text-3xs compact:tracking-wide">{{ label }}</dt>
    <dd class="m-0 font-display leading-tight text-archive-copy-warm compact:text-xs">
      <template v-for="(line, index) in lines" :key="line">
        <br v-if="index" />{{ line }}
      </template>
    </dd>
    <span v-if="divider" class="[ method-fact-divider-compact ] absolute top-1/2 right-0 hidden h-12 w-px -translate-y-1/2 bg-archive-rule-warm/28 compact:block" aria-hidden="true" />
  </div>
</template>
