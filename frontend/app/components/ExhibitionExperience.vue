<script setup lang="ts">
// Opens an exported 360° tour in a full-viewport modal. The viewer is the
// editor project's embeddable widget, copied to public/media/tour-viewer/,
// and its contract (order of calls, destroy on close, fullscreen as an
// enhancement only) is the editor repository's docs/embedding.md.
// The page renders this button only while the record is open (see
// utils/tourAccess); every other state is a status line, never a
// disabled button.
const props = defineProps<{
  tourUrl: string
}>()

const VIEWER_SCRIPT = '/media/tour-viewer/tour-viewer.js'
const VIEWER_STYLES = '/media/tour-viewer/tour-viewer.css'

interface MountedTour {
  destroy: () => void
}

interface TourViewerModule {
  mountTour: (container: HTMLElement, options: { tourUrl: string, closable?: boolean }) => Promise<MountedTour>
}

const opening = ref(false)
const trigger = ref<{ $el?: HTMLElement } | null>(null)
let closeCurrent: (() => void) | null = null

// The stylesheet is added once and the promise is cached: a <link> fires
// load/error exactly once, so re-listening on a later click would wait
// forever. A failed stylesheet resolves too — the tour looks wrong but opens.
let stylesPromise: Promise<void> | null = null
const loadStyles = () => {
  if (stylesPromise) return stylesPromise
  stylesPromise = new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = VIEWER_STYLES
    link.addEventListener('load', () => resolve(), { once: true })
    link.addEventListener('error', () => resolve(), { once: true })
    document.head.append(link)
  })
  return stylesPromise
}

const openTour = async () => {
  if (opening.value || closeCurrent) return
  opening.value = true

  const modal = document.createElement('div')
  modal.className = '[ exhibition-tour-modal ] fixed inset-0 z-50 bg-black'
  document.body.append(modal)

  // Fullscreen must be requested synchronously, before any await spends the
  // click's user activation. The modal already covers the page by CSS, so a
  // refusal (iPhone Safari has no element fullscreen) changes nothing.
  modal.requestFullscreen?.().catch(() => {})

  const previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  let tour: MountedTour | null = null
  let closed = false
  const close = () => {
    // tour:close and fullscreenchange both fire on the close control, and
    // destroy() twice throws — so close runs once.
    if (closed) return
    closed = true
    closeCurrent = null
    tour?.destroy()
    modal.remove()
    document.body.style.overflow = previousBodyOverflow
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    trigger.value?.$el?.focus?.()
  }
  const onFullscreenChange = () => {
    if (!document.fullscreenElement) close()
  }
  closeCurrent = close
  modal.addEventListener('tour:close', close)
  document.addEventListener('fullscreenchange', onFullscreenChange)

  try {
    const [{ mountTour }] = await Promise.all([
      import(/* @vite-ignore */ VIEWER_SCRIPT) as Promise<TourViewerModule>,
      loadStyles()
    ])
    if (closed) return
    tour = await mountTour(modal, { tourUrl: props.tourUrl, closable: true })
    if (closed) tour.destroy()
  } catch (error) {
    console.error('The 360° tour could not be opened.', error)
    close()
  } finally {
    opening.value = false
  }
}

// Leaving the page must release the WebGL context like any other close;
// an open tour that outlives its page would leak one context per visit.
onBeforeUnmount(() => closeCurrent?.())
</script>

<template>
  <ArchiveButton
    ref="trigger"
    type="button"
    :aria-busy="opening || undefined"
    @click="openTour"
  >
    {{ opening ? $t('exhibition.openingExperience') : $t('exhibition.startExperience') }} <ArchiveArrow />
  </ArchiveButton>
</template>
