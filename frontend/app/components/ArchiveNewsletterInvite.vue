<script setup lang="ts">
import { INVITE_DELAY_MS, firstLoadedImage, inviteAllowed, invitePictures, inviteSuppressedOn } from '~/utils/newsletter'
import type { InviteRecord } from '~/utils/newsletter'

// The newsletter modal in the centre of the page. No form (owner, 2026-11-09): it says that a
// newsletter exists and links to /newsletter/, on every screen size. ×, Escape or a click
// beside it close it for 30 days; "never show again" for good. It shows at most once in 30
// days, counted from showing. Rules: `inviteAllowed` (utils/newsletter.ts). Mounted once in
// app.vue, beside the cookie notice. The picture is the room picture (`start-view.jpg`, the
// tour's first view) of the newest exhibition with an open 360° tour; it loads while the 10 s
// run, and when none loads, the Parkschlössl shows.
const FALLBACK_IMAGE = '/media/images/landing/parkschloessl.jpg'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const invite = useNewsletterInvite()
const cookieNotice = useCookieNotice()
// Pictures from galleries in Austria only, like the overview pages (shared/countries.mjs).
const { overviewExhibitions: venueExhibitions } = useArchiveData()
const today = useArchiveToday()

const record = ref<InviteRecord | null>(null)
const shownThisVisit = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const loadedSrc = ref<string | null>(null)
const pictures = computed(() => invitePictures(venueExhibitions.value, today.value))

const picture = computed(() => {
  const exhibition = pictures.value.find((item) => item.src === loadedSrc.value)?.exhibition
  if (!exhibition) return { src: FALLBACK_IMAGE, alt: t('newsletter.invite.fallbackAlt'), caption: undefined }
  return {
    src: loadedSrc.value!,
    alt: t('newsletter.invite.roomAlt', { title: exhibition.title }),
    caption: [exhibition.title, exhibition.venue, exhibition.city].filter(Boolean).join(', ')
  }
})

let picking = false
const pickPicture = async () => {
  if (picking || loadedSrc.value || !pictures.value.length) return
  picking = true
  loadedSrc.value = await firstLoadedImage(pictures.value.map((item) => item.src))
  picking = false
}

const eligible = computed(() => !invite.heldForIntro.value && !shownThisVisit.value && inviteAllowed({
  record: record.value,
  now: Date.now(),
  path: route.path,
  cookieNoticeOpen: cookieNotice.isVisible.value
}))

const stopTimer = () => {
  clearTimeout(timer)
  timer = undefined
}

onMounted(() => {
  record.value = invite.read()
  watch(eligible, (allowed) => {
    stopTimer()
    if (!allowed) return
    void pickPicture()
    timer = setTimeout(() => {
      if (!eligible.value) return
      shownThisVisit.value = true
      invite.show()
    }, INVITE_DELAY_MS)
  }, { immediate: true })
  // The archive can arrive after the timer started: then the picture is looked for at that moment.
  watch(pictures, () => {
    if (eligible.value) void pickPicture()
  })
})

// The sign-up page is where the link leads: the modal steps aside there (without counting as a "no").
watch(() => route.path, (path) => {
  if (invite.visible.value && inviteSuppressedOn(path)) invite.hide()
})

onBeforeUnmount(stopTimer)
</script>

<template>
  <ArchiveModal
    :open="invite.visible.value"
    labelledby="newsletter-invite-title"
    describedby="newsletter-invite-text"
    :close-label="$t('newsletter.invite.close')"
    panel-class="[ newsletter-invite ] max-w-4xl"
    @close="invite.dismiss()"
  >
    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-10 px-8 py-8 medium:grid-cols-1 medium:gap-y-2 medium:px-5 medium:pt-12 medium:pb-6 compact:px-1 compact:pt-10 compact:pb-3">
      <ArchiveRecordFigure
        class="[ newsletter-invite-figure ] medium:mx-auto medium:w-full medium:max-w-md medium:pr-0"
        image-class="aspect-[1.1] medium:aspect-[1.9]"
        :src="picture.src"
        :alt="picture.alt"
        :caption="picture.caption"
        data-part="image"
      />
      <div class="[ newsletter-invite-copy ] pr-6 medium:pr-0">
        <ArchiveEyebrow ornament="section">{{ $t('newsletter.invite.title') }}</ArchiveEyebrow>
        <h2 id="newsletter-invite-title" class="m-0 mb-4 font-display text-h3 font-normal compact:text-3xl">{{ $t('newsletter.invite.heading') }}</h2>
        <p id="newsletter-invite-text" class="m-0 mb-7 text-base leading-relaxed text-archive-body compact:mb-5 compact:text-sm">{{ $t('newsletter.invite.text') }}</p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-4 compact:grid compact:grid-cols-1 compact:justify-items-center">
          <ArchiveButton :to="localePath('/newsletter/')" class="compact:w-full" data-part="to-page">
            {{ $t('newsletter.invite.subscribe') }} <ArchiveArrow />
          </ArchiveButton>
          <button
            class="border-0 bg-transparent p-0 text-meta text-archive-muted underline decoration-archive-muted/40 underline-offset-4 transition-colors duration-150 hover:text-archive-red hover:decoration-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red"
            type="button"
            data-part="never"
            @click="invite.neverAgain()"
          >
            {{ $t('newsletter.invite.neverAgain') }}
          </button>
        </div>
      </div>
    </div>
  </ArchiveModal>
</template>
