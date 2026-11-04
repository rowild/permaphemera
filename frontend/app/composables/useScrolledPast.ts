/**
 * True once the page is scrolled past `enter` pixels, false again only below `leave`. The gap
 * keeps a sticky element that changes its height on the switch (the header) from flickering:
 * the page moves by the height it loses. One passive listener, read once per frame.
 */
export const useScrolledPast = ({ enter, leave }: { enter: number, leave: number }) => {
  const past = ref(false)
  let frame = 0
  const update = () => {
    frame = 0
    const y = window.scrollY
    if (!past.value && y > enter) past.value = true
    else if (past.value && y < leave) past.value = false
  }
  const onScroll = () => { frame ||= requestAnimationFrame(update) }
  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
  })
  return readonly(past)
}
