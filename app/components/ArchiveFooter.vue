<script setup lang="ts">
const { sponsors } = useArchiveData()
const { t } = useI18n()
const sponsorStripRef = ref<HTMLElement | null>(null)
const sponsorTrackRef = ref<HTMLElement | null>(null)
const sponsorNeedsScroll = ref(false)
let dragStartX = 0
let dragStartScroll = 0
const dragging = ref(false)
const footerMenuOpen = ref(false)
const footerMenuButtonRef = ref<HTMLButtonElement | null>(null)
const footerDrawerRef = ref<HTMLElement | null>(null)
const footerDrawerCloseRef = ref<HTMLButtonElement | null>(null)
const route = useRoute()
let sponsorResizeObserver: ResizeObserver | null = null
let drawerMediaQuery: MediaQueryList | null = null
let previousBodyOverflow = ''

const updateSponsorOverflow = () => {
  const strip = sponsorStripRef.value
  if (!strip) return

  sponsorNeedsScroll.value = strip.scrollWidth > strip.clientWidth + 1
}

const startDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !sponsorNeedsScroll.value) return

  dragging.value = true
  dragStartX = event.clientX
  dragStartScroll = strip.scrollLeft
  strip.setPointerCapture(event.pointerId)
}

const moveDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !dragging.value) return
  strip.scrollLeft = dragStartScroll - (event.clientX - dragStartX)
}

const endDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !dragging.value) return

  dragging.value = false
  if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId)
}

const scrollSponsors = (direction: number) => {
  sponsorStripRef.value?.scrollBy({ left: direction * 320, behavior: 'smooth' })
}

const closeFooterMenu = () => {
  footerMenuOpen.value = false
}

const trapFooterMenuFocus = (event: KeyboardEvent) => {
  const drawer = footerDrawerRef.value
  if (!drawer) return

  const focusableElements = [...drawer.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hasAttribute('hidden'))

  if (!focusableElements.length) {
    event.preventDefault()
    drawer.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)
  const activeElement = document.activeElement

  if (event.shiftKey && (activeElement === firstElement || activeElement === drawer)) {
    event.preventDefault()
    lastElement?.focus()
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement?.focus()
  }
}

const restoreBodyScroll = () => {
  if (!import.meta.client) return
  document.body.style.overflow = previousBodyOverflow
}

const handleDrawerViewportChange = (event: MediaQueryListEvent) => {
  if (!event.matches) closeFooterMenu()
}

watch(footerMenuOpen, async (open) => {
  if (!import.meta.client) return

  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    footerDrawerCloseRef.value?.focus()
  } else {
    restoreBodyScroll()
    await nextTick()
    footerMenuButtonRef.value?.focus()
  }
})

watch(() => route.fullPath, closeFooterMenu)

onMounted(async () => {
  await nextTick()
  updateSponsorOverflow()

  sponsorResizeObserver = new ResizeObserver(updateSponsorOverflow)
  if (sponsorStripRef.value) sponsorResizeObserver.observe(sponsorStripRef.value)
  if (sponsorTrackRef.value) sponsorResizeObserver.observe(sponsorTrackRef.value)

  drawerMediaQuery = window.matchMedia('(max-width: 1280px)')
  drawerMediaQuery.addEventListener('change', handleDrawerViewportChange)
})

onBeforeUnmount(() => {
  sponsorResizeObserver?.disconnect()
  drawerMediaQuery?.removeEventListener('change', handleDrawerViewportChange)
  restoreBodyScroll()
})
</script>

<template>
  <footer class="[ site-footer ] archive-footer-surface relative isolate mt-8 overflow-hidden px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3.5rem,5vw,5rem)] pb-[2.3rem] text-archive-footer-copy compact:mt-4 compact:px-4 compact:pt-8 compact:pb-5">
    <section class="[ supporters ] relative z-1 mx-auto max-w-none">
      <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-[0.95rem] font-medium tracking-[0.06em] text-archive-ochre uppercase compact:mb-2 compact:text-xs">{{ $t('footer.supporters') }}</p>
      <h2 class="m-0 max-w-208 font-display text-[clamp(2.6rem,4.1vw,4.15rem)] font-normal leading-[0.98] tracking-normal text-archive-night-heading compact:text-3xl">{{ $t('footer.title') }} <span class="text-archive-ochre">{{ $t('footer.accent') }}</span></h2>
      <div class="[ sponsor-frame ] archive-sponsor-frame relative left-1/2 mt-10 mb-[3.2rem] w-[calc(100vw-clamp(2rem,5vw,5rem))] -translate-x-1/2 border-16 border-transparent bg-transparent py-[0.4rem] compact:mt-5 compact:mb-6 compact:w-[calc(100vw-1rem)] compact:py-0" :class="{ 'mb-[0.7rem]': sponsorNeedsScroll }">
        <div
          ref="sponsorStripRef"
          class="[ sponsor-strip ] archive-sponsor-strip scrollbar-none w-full touch-pan-y overflow-x-auto py-[0.7rem] select-none"
          :class="dragging ? 'cursor-grabbing' : sponsorNeedsScroll ? 'cursor-grab' : 'cursor-default'"
          :aria-label="$t('footer.supportersAria')"
          :tabindex="sponsorNeedsScroll ? 0 : -1"
          @pointerdown="startDrag"
          @pointermove="moveDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <div ref="sponsorTrackRef" class="[ sponsor-track ] flex w-max items-center px-5">
            <ArchiveSponsorMark
              v-for="(sponsor, index) in sponsors"
              :key="sponsor.id"
              :sponsor="sponsor"
              :divider="index < sponsors.length - 1"
            />
          </div>
        </div>
      </div>
      <div v-if="sponsorNeedsScroll" class="[ sponsor-scroll-hint ] mx-auto mb-[3.2rem] flex w-fit items-center justify-center gap-[1.2rem] font-display text-[0.98rem] whitespace-nowrap text-archive-ochre/88 compact:mb-6 compact:gap-1 compact:text-xs" :aria-label="$t('footer.carouselAria')">
        <button class="inline-flex min-h-11 min-w-11 items-center justify-center border-0 bg-transparent text-inherit transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red" type="button" :aria-label="$t('footer.scrollLeft')" @click="scrollSponsors(-1)"><ArchiveArrow class="w-[2.2rem]" direction="left" /></button>
        <span>{{ $t('footer.scrollHint') }}</span>
        <button class="inline-flex min-h-11 min-w-11 items-center justify-center border-0 bg-transparent text-inherit transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red" type="button" :aria-label="$t('footer.scrollRight')" @click="scrollSponsors(1)"><ArchiveArrow class="w-[2.2rem]" /></button>
      </div>
    </section>

    <ArchiveFooterIdentity :show-language="false" class="[ mobile-footer-identity ] relative z-1 hidden border-y border-archive-ochre/20 py-4 tablet:block" />
    <ArchiveFooterMenu variant="desktop" />

    <button
      ref="footerMenuButtonRef"
      class="[ mobile-footer-menu-trigger ] relative z-1 mt-1 hidden min-h-12 w-full items-center justify-between border-b border-archive-ochre/30 bg-transparent px-1 py-2 font-display text-sm tracking-widest text-archive-footer-copy uppercase transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-ochre tablet:flex"
      type="button"
      aria-controls="mobile-footer-navigation"
      :aria-expanded="footerMenuOpen"
      @click="footerMenuOpen = true"
    >
      <span>{{ $t('footer.menu') }}</span>
      <span class="svg-icon svg-icon-menu inline-block size-5 flex-none bg-current" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0"
      >
        <div
          v-if="footerMenuOpen"
          class="[ mobile-footer-drawer ] fixed inset-0 z-20 hidden items-end bg-archive-backdrop/58 tablet:grid"
          @click.self="closeFooterMenu"
          @keydown.esc="closeFooterMenu"
        >
          <section
            id="mobile-footer-navigation"
            ref="footerDrawerRef"
            class="[ mobile-footer-drawer-panel ] archive-footer-surface relative max-h-[88dvh] w-full overflow-y-auto border-t border-archive-ochre/42 px-4 pt-4 pb-6 text-archive-footer-copy shadow-[0_-1.2rem_2.6rem_rgba(18,12,8,0.38)]"
            role="dialog"
            aria-modal="true"
            :aria-label="$t('footer.navigationAria')"
            tabindex="-1"
            @keydown.tab="trapFooterMenuFocus"
          >
            <div class="relative z-1 mb-3 flex items-center justify-between border-b border-archive-ochre/20 pb-3">
              <p class="m-0 font-display text-xs tracking-widest text-archive-ochre uppercase">{{ $t('footer.navigation') }}</p>
              <button
                ref="footerDrawerCloseRef"
                class="grid size-9 place-items-center border-0 bg-transparent p-0 font-display text-xl leading-none text-archive-footer-copy/74 transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-ochre"
                type="button"
                :aria-label="$t('footer.closeNavigation')"
                @click="closeFooterMenu"
              >
                <span aria-hidden="true">&#215;</span>
              </button>
            </div>
            <ArchiveFooterMenu variant="drawer" />
          </section>
        </div>
      </Transition>
    </Teleport>

    <div class="[ footer-bottom ] relative z-1 mx-auto grid max-w-384 grid-cols-2 items-start gap-6 pt-[2.2rem] font-display text-archive-footer-copy/85 compact:gap-4 compact:pt-4 compact:text-xs compact:leading-tight">
      <p class="m-0 min-w-0 text-left">
        &copy; 2026 PERMAPHEMERA.<br class="hidden compact:block"> {{ $t('footer.copyright') }}
      </p>
      <p class="m-0 min-w-0 text-right">
        {{ $t('footer.curated') }}
      </p>
    </div>
  </footer>
</template>
