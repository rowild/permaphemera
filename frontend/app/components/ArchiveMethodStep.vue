<script setup lang="ts">
defineProps<{
  icon: string
  number: string
  title: string
  text: string
  divider?: boolean
}>()
</script>

<template>
  <article class="[ method-step ] relative grid min-h-[9.4rem] min-w-0 grid-cols-[4.8rem_minmax(0,1fr)] items-center gap-5 px-8 py-[1.35rem] compact:min-h-28 compact:grid-cols-[3.5rem_minmax(0,1fr)] compact:gap-3 compact:px-4 compact:py-3" :class="{ 'archive-method-step-divider': divider }">
    <img class="[ method-step-icon ] block h-20 w-[4.4rem] object-contain object-center compact:h-14 compact:w-12" :src="icon" alt="" aria-hidden="true" />
    <div>
      <p class="[ method-step-number ] archive-method-step-number m-0 mb-1 flex items-center gap-[0.35rem] font-display text-title leading-none text-archive-red compact:text-base">
        {{ number }}
      </p>
      <h3 class="m-0 overflow-hidden font-display text-2xl leading-[1.08] font-medium compact:text-xl">{{ title }}</h3>
      <p class="mt-[0.35rem] mb-0 text-archive-muted compact:mt-1 compact:text-sm compact:leading-tight">{{ text }}</p>
    </div>
  </article>
</template>
