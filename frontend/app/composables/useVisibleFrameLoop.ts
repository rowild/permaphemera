import type { Ref } from 'vue'

/**
 * A requestAnimationFrame loop that runs only while `target` is on screen (the hero wheel drew
 * every frame forever, also far below the fold). `start()` arms it; it stops on unmount.
 */
export const useVisibleFrameLoop = (target: Ref<Element | null>, frame: (time: number) => void) => {
  let armed = false
  let visible = true
  let id = 0
  let observer: IntersectionObserver | undefined

  const tick = (time: number) => {
    id = 0
    frame(time)
    schedule()
  }
  function schedule() {
    if (armed && visible && !id) id = requestAnimationFrame(tick)
  }
  const pause = () => {
    if (id) cancelAnimationFrame(id)
    id = 0
  }

  onMounted(() => {
    if (!target.value || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) schedule()
      else pause()
    })
    observer.observe(target.value)
  })
  onBeforeUnmount(() => {
    armed = false
    pause()
    observer?.disconnect()
  })

  return {
    start() {
      armed = true
      schedule()
    },
    stop() {
      armed = false
      pause()
    }
  }
}
