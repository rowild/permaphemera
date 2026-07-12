<script setup lang="ts">
const { sponsors } = useArchiveData()
const sponsorStripRef = ref<HTMLElement | null>(null)
const sponsorTrackRef = ref<HTMLElement | null>(null)
const sponsorNeedsScroll = ref(false)
let dragStartX = 0
let dragStartScroll = 0
let dragging = false
let sponsorResizeObserver: ResizeObserver | null = null

const updateSponsorOverflow = () => {
  const strip = sponsorStripRef.value
  if (!strip) return

  sponsorNeedsScroll.value = strip.scrollWidth > strip.clientWidth + 1
}

const startDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !sponsorNeedsScroll.value) return

  dragging = true
  dragStartX = event.clientX
  dragStartScroll = strip.scrollLeft
  strip.setPointerCapture(event.pointerId)
  strip.classList.add('is-dragging')
}

const moveDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !dragging) return
  strip.scrollLeft = dragStartScroll - (event.clientX - dragStartX)
}

const endDrag = (event: PointerEvent) => {
  const strip = sponsorStripRef.value
  if (!strip || !dragging) return

  dragging = false
  if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId)
  strip.classList.remove('is-dragging')
}

const scrollSponsors = (direction: number) => {
  sponsorStripRef.value?.scrollBy({ left: direction * 320, behavior: 'smooth' })
}

onMounted(async () => {
  await nextTick()
  updateSponsorOverflow()

  sponsorResizeObserver = new ResizeObserver(updateSponsorOverflow)
  if (sponsorStripRef.value) sponsorResizeObserver.observe(sponsorStripRef.value)
  if (sponsorTrackRef.value) sponsorResizeObserver.observe(sponsorTrackRef.value)
})

onBeforeUnmount(() => {
  sponsorResizeObserver?.disconnect()
})
</script>

<template>
  <footer class="site-footer">
    <section class="supporters">
      <p class="eyebrow">Supporters & partners</p>
      <h2>Supported by institutions that care for <span>cultural memory.</span></h2>
      <div class="sponsor-frame" :class="{ 'has-overflow': sponsorNeedsScroll }">
        <div
          ref="sponsorStripRef"
          class="sponsor-strip"
          :class="{ 'has-overflow': sponsorNeedsScroll }"
          aria-label="Supporters and partners"
          :tabindex="sponsorNeedsScroll ? 0 : -1"
          @pointerdown="startDrag"
          @pointermove="moveDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <div ref="sponsorTrackRef" class="sponsor-track">
            <template v-for="(sponsor, index) in sponsors" :key="sponsor.id">
              <div class="sponsor-mark">
                <img :src="`/images/landing/sponsors/${sponsor.id}.png`" alt="" aria-hidden="true" draggable="false" />
                <span>{{ sponsor.name }}</span>
              </div>
              <span
                v-if="index < sponsors.length - 1"
                class="sponsor-divider"
                aria-hidden="true"
              />
            </template>
          </div>
        </div>
      </div>
      <div v-if="sponsorNeedsScroll" class="sponsor-scroll-hint" aria-label="Sponsor carousel controls">
        <button type="button" aria-label="Scroll sponsors left" @click="scrollSponsors(-1)"><ArchiveArrow direction="left" /></button>
        <span>Scroll to explore more partners</span>
        <button type="button" aria-label="Scroll sponsors right" @click="scrollSponsors(1)"><ArchiveArrow /></button>
      </div>
    </section>

    <section class="footer-links">
      <div class="footer-brand">
        <NuxtLink class="footer-brand-lockup" to="/" aria-label="PERMAPHEMERA home">
          <span class="footer-brand-mark" aria-hidden="true" />
          <strong>PERMAPHEMERA</strong>
        </NuxtLink>
        <span class="footer-brand-rule" aria-hidden="true" />
        <p>A curated Austrian archive of 360-degree exhibition documentation.</p>
        <div class="language-switch">
          <a href="/" aria-current="page">EN</a><span>/</span><a href="/">DE</a>
        </div>
      </div>
      <nav aria-label="Footer explore navigation">
        <p>Explore</p>
        <NuxtLink to="/#locations">Archive</NuxtLink>
        <NuxtLink to="/locations/parkschloessl-spittal-drau/">Galleries</NuxtLink>
        <NuxtLink to="/#artists">Artists</NuxtLink>
        <NuxtLink to="/#exhibitions">Exhibitions</NuxtLink>
      </nav>
      <nav aria-label="Footer information navigation">
        <p>Information</p>
        <NuxtLink to="/#method">About</NuxtLink>
        <NuxtLink to="/#method">How it works</NuxtLink>
        <a href="mailto:archive@example.test">Contact</a>
      </nav>
      <nav aria-label="Footer legal navigation">
        <p>Legal</p>
        <a href="/">Imprint</a><a href="/">Privacy Policy</a><a href="/">Terms & Conditions</a><a href="/">Accessibility</a><a href="/">Cookies</a>
      </nav>
      <img class="footer-seal" src="/images/landing/footer/permanently-preserved-stamp.png" alt="Permanently preserved, temporarily enduring" />
    </section>

    <div class="footer-bottom">
      <div class="footer-bottom-group footer-bottom-left"><span>&copy; 2026 PERMAPHEMERA. All rights reserved.</span></div>
      <div class="footer-bottom-group footer-bottom-center-group">
        <span class="footer-bottom-center" aria-hidden="true" />
      </div>
      <div class="footer-bottom-group footer-bottom-right">
        <span>Curated independently in Austria.</span>
        <span class="footer-bottom-end" aria-hidden="true" />
      </div>
    </div>
  </footer>
</template>
