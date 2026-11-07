<script setup lang="ts">
import { INVITE_DELAY_MS, inviteAllowed, inviteSuppressedOn } from '~/utils/newsletter'
import type { InviteRecord } from '~/utils/newsletter'

// The small newsletter invite at the bottom right (on phones the bottom edge). It does not
// take the focus and needs no answer; × or Escape closes it for 30 days. Rules:
// `inviteAllowed` (utils/newsletter.ts). Mounted once in app.vue, beside the cookie notice.
const route = useRoute()
const localePath = useLocalePath()
const invite = useNewsletterInvite()
const cookieNotice = useCookieNotice()

const record = ref<InviteRecord | null>(null)
const shownThisVisit = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

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
    timer = setTimeout(() => {
      if (!eligible.value) return
      shownThisVisit.value = true
      invite.show()
    }, INVITE_DELAY_MS)
  }, { immediate: true })
})

// The full form is on /newsletter/: the invite steps aside there (without counting as a "no").
watch(() => route.path, (path) => {
  if (invite.visible.value && inviteSuppressedOn(path)) invite.hide()
})

onBeforeUnmount(stopTimer)
</script>

<template>
  <Transition name="archive-consent-panel">
    <aside
      v-if="invite.visible.value"
      class="[ newsletter-invite ] archive-modal-frame fixed right-6 bottom-6 z-30 w-md border-16 border-transparent bg-transparent px-5 py-4 text-archive-ink drop-shadow-xl compact:right-3 compact:bottom-3 compact:left-3 compact:w-auto compact:px-3 compact:py-3"
      role="dialog"
      aria-labelledby="newsletter-invite-title"
      aria-describedby="newsletter-invite-text"
      @keydown.esc="invite.dismiss()"
    >
      <div class="mb-1 flex items-start justify-between gap-4">
        <p id="newsletter-invite-title" class="m-0 font-display text-sm font-medium tracking-widest text-archive-red uppercase compact:text-xs">{{ $t('newsletter.invite.title') }}</p>
        <button
          class="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center border-0 bg-transparent p-0 font-display text-xl leading-none text-archive-muted transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red"
          type="button"
          data-part="close"
          :aria-label="$t('newsletter.invite.close')"
          @click="invite.dismiss()"
        >
          <span aria-hidden="true">&#215;</span>
        </button>
      </div>
      <p id="newsletter-invite-text" class="m-0 mb-4 text-sm leading-relaxed text-archive-body compact:mb-3">{{ $t('newsletter.invite.text') }}</p>
      <!-- On phones the form would cover most of the screen: there the invite only leads to /newsletter/. -->
      <ArchiveNewsletterForm class="compact:hidden" variant="compact" source="invite" />
      <div class="hidden compact:block">
        <ArchiveButton class="w-full" :to="localePath('/newsletter/')" data-part="to-page">
          {{ $t('newsletter.form.submit') }} <ArchiveArrow />
        </ArchiveButton>
      </div>
    </aside>
  </Transition>
</template>
