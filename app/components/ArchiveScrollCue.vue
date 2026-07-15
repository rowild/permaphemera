<script setup lang="ts">
const props = withDefaults(defineProps<{
  target: string
  label: string
  enabled?: boolean
}>(), {
  enabled: true
})

const targetVisible = ref(false)
let targetObserver: IntersectionObserver | undefined

const observeTarget = () => {
  targetObserver?.disconnect()

  const targetElement = document.querySelector<HTMLElement>(props.target)
  if (!targetElement || !('IntersectionObserver' in window)) return

  targetObserver = new IntersectionObserver(([entry]) => {
    targetVisible.value = Boolean(entry?.isIntersecting)
  }, { threshold: 0.01 })
  targetObserver.observe(targetElement)
}

onMounted(() => {
  void nextTick(observeTarget)
})

watch(() => props.target, () => {
  void nextTick(observeTarget)
})

onBeforeUnmount(() => {
  targetObserver?.disconnect()
})
</script>

<template>
  <Transition name="hero-scroll-cue">
    <a v-if="enabled && !targetVisible" class="[ scroll-cue ] hero-scroll-cue absolute bottom-[0.8rem] left-1/2 z-5 grid -translate-x-1/2 grid-cols-[2.4rem_1.8rem_2.4rem] items-center gap-[0.55rem] text-archive-red/52 no-underline transition-[color,filter,opacity,translate] duration-[0.35s,0.35s,0.5s,0.65s] ease-[ease,ease,ease,cubic-bezier(0.22,1,0.36,1)] hover:text-archive-red/74 hover:filter-[drop-shadow(0_0.35rem_0.28rem_rgba(69,47,27,0.16))] focus-visible:text-archive-red/74 focus-visible:filter-[drop-shadow(0_0.35rem_0.28rem_rgba(69,47,27,0.16))] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[0.35rem] focus-visible:outline-archive-red/72 motion-reduce:transition-none tablet:bottom-6 compact:grid-cols-[1.6rem_1.6rem_1.6rem]" :href="target" :aria-label="label">
      <span class="[ scroll-cue-rule ] h-px bg-linear-to-r from-transparent to-current" aria-hidden="true" />
      <span class="[ scroll-cue-mark ] hero-scroll-cue-mark block size-[1.8rem] filter-[drop-shadow(0_0.25rem_0.18rem_rgba(69,47,27,0.12))] compact:size-[1.6rem]" aria-hidden="true">
        <svg class="block size-full overflow-visible fill-none stroke-current" viewBox="0 0 32 32" role="presentation">
          <path class="fill-none stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]" d="M16 5v20m-7-7 7 7 7-7" />
        </svg>
      </span>
      <span class="[ scroll-cue-rule ] h-px bg-linear-to-r from-current to-transparent" aria-hidden="true" />
    </a>
  </Transition>
</template>
