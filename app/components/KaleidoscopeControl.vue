<script setup lang="ts">
const props = defineProps<{
  direction: 'left' | 'up' | 'right'
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  activate: []
}>()

const directionClasses = {
  left: 'transform-[translateY(calc(0.52rem+var(--wheel-control-reveal-y)))]',
  up: 'transform-[translateY(calc(-0.1rem+var(--wheel-control-reveal-y)))]',
  right: 'transform-[translateY(calc(0.52rem+var(--wheel-control-reveal-y)))]'
} as const
</script>

<template>
  <button
    class="wheel-control relative grid h-[3.3rem] w-[4.55rem] cursor-pointer place-items-center border-0 bg-transparent text-archive-red opacity-0 isolate [--wheel-control-reveal-y:0rem] transform-3d focus-visible:outline-1 focus-visible:outline-offset-[0.18rem] focus-visible:outline-archive-red/74 disabled:cursor-not-allowed compact:h-[2.7rem] compact:w-[3.65rem]"
    :class="[`wheel-control-${props.direction}`, directionClasses[props.direction]]"
    type="button"
    :disabled="props.disabled"
    :aria-label="props.label"
    @click="emit('activate')"
  >
    <span class="wheel-control-visual pointer-events-none absolute inset-0 origin-center transform-[rotateX(56deg)] transform-3d transition-[translate,scale] duration-[0.28s,0.16s] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none" aria-hidden="true">
      <span class="wheel-control-plane" />
    </span>
  </button>
</template>
