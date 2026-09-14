<script setup lang="ts">
const props = defineProps<{
  id: string
  text: string
}>()
</script>

<template>
  <span class="[ archive-action-hint ] group/action-hint relative inline-flex">
    <slot :described-by="props.id" />
    <ArchiveTooltipFrame
      :id="props.id"
      class="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-20 w-max max-w-64 -translate-x-1/2 translate-y-1 -rotate-1 scale-95 px-3 py-2 text-center font-display text-sm leading-tight text-archive-ink opacity-0 filter-[drop-shadow(0_0.38rem_0.42rem_rgba(75,52,29,0.18))] transition-[opacity,transform,translate,scale,rotate] duration-200 ease-out group-hover/action-hint:translate-y-0 group-hover/action-hint:scale-100 group-hover/action-hint:opacity-100 group-focus-within/action-hint:translate-y-0 group-focus-within/action-hint:scale-100 group-focus-within/action-hint:opacity-100 motion-reduce:transition-none"
      pointer-side="bottom"
      role="tooltip"
    >
      {{ props.text }}
    </ArchiveTooltipFrame>
  </span>
</template>
