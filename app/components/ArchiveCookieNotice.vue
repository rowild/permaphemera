<script setup lang="ts">
const localePath = useLocalePath()
const {
  isVisible,
  analyticsConsent,
  googleMapsConsent,
  youtubeConsent,
  initialize,
  savePreferences,
  acceptAll
} = useCookieNotice()

const analyticsSelected = ref(false)
const googleMapsSelected = ref(false)
const youtubeSelected = ref(false)

const syncSelection = () => {
  analyticsSelected.value = analyticsConsent.value === 'granted'
  googleMapsSelected.value = googleMapsConsent.value === 'granted'
  youtubeSelected.value = youtubeConsent.value === 'granted'
}

const saveSelection = () => {
  savePreferences({
    analytics: analyticsSelected.value,
    googleMaps: googleMapsSelected.value,
    youtube: youtubeSelected.value
  })
}

const acceptAllServices = () => {
  analyticsSelected.value = true
  googleMapsSelected.value = true
  youtubeSelected.value = true
  acceptAll()
}

watch(isVisible, (visible) => {
  if (visible) syncSelection()
})

onMounted(() => {
  initialize()
  syncSelection()
})
</script>

<template>
  <Transition name="archive-consent-panel">
    <aside
      v-if="isVisible"
      class="[ cookie-notice ] archive-modal-frame fixed right-6 bottom-6 left-6 z-40 mx-auto max-w-3xl border-16 border-transparent bg-transparent px-6 py-5 text-archive-ink drop-shadow-xl compact:right-3 compact:bottom-3 compact:left-3 compact:px-4 compact:py-4"
      role="dialog"
      aria-labelledby="cookie-settings-title"
      aria-describedby="cookie-settings-description"
    >
      <form class="grid gap-4" @submit.prevent="saveSelection">
        <div class="min-w-0">
          <p id="cookie-settings-title" class="m-0 mb-2 font-display text-sm font-medium tracking-widest text-archive-red uppercase compact:text-xs">
            {{ $t('privacyNotice.title') }}
          </p>
          <p id="cookie-settings-description" class="m-0 max-w-2xl text-sm leading-relaxed text-archive-body">
            {{ $t('privacyNotice.description') }}
          </p>
        </div>

        <fieldset class="m-0 grid grid-cols-2 gap-x-8 gap-y-4 border-0 p-0 compact:grid-cols-1 compact:gap-3">
          <legend class="sr-only">{{ $t('privacyNotice.selectionAria') }}</legend>

          <label class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
            <input class="mt-1 size-5 shrink-0 accent-archive-red" type="checkbox" checked disabled>
            <span class="min-w-0">
              <span class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span class="font-display text-base text-archive-ink">{{ $t('privacyNotice.necessary.title') }}</span>
                <span class="font-display text-xs tracking-widest text-archive-muted uppercase">{{ $t('privacyNotice.alwaysActive') }}</span>
              </span>
              <span class="block text-xs leading-snug text-archive-muted">{{ $t('privacyNotice.necessary.description') }}</span>
            </span>
          </label>

          <label class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
            <input v-model="analyticsSelected" class="mt-1 size-5 shrink-0 cursor-pointer accent-archive-red" type="checkbox">
            <span class="min-w-0">
              <span class="font-display text-base text-archive-ink">{{ $t('privacyNotice.analytics.title') }}</span>
              <span class="block text-xs leading-snug text-archive-muted">{{ $t('privacyNotice.analytics.description') }}</span>
            </span>
          </label>

          <label class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
            <input v-model="googleMapsSelected" class="mt-1 size-5 shrink-0 cursor-pointer accent-archive-red" type="checkbox">
            <span class="min-w-0">
              <span class="font-display text-base text-archive-ink">{{ $t('privacyNotice.googleMaps.title') }}</span>
              <span class="block text-xs leading-snug text-archive-muted">{{ $t('privacyNotice.googleMaps.description') }}</span>
            </span>
          </label>

          <label class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
            <input v-model="youtubeSelected" class="mt-1 size-5 shrink-0 cursor-pointer accent-archive-red" type="checkbox">
            <span class="min-w-0">
              <span class="font-display text-base text-archive-ink">{{ $t('privacyNotice.youtube.title') }}</span>
              <span class="block text-xs leading-snug text-archive-muted">{{ $t('privacyNotice.youtube.description') }}</span>
            </span>
          </label>
        </fieldset>

        <div class="flex flex-wrap items-center justify-between gap-3 compact:grid compact:grid-cols-1">
          <ArchiveTextLink :to="localePath('/privacy/')">{{ $t('privacyNotice.details') }}</ArchiveTextLink>
          <div class="flex flex-wrap justify-end gap-2 compact:grid compact:grid-cols-1">
            <ArchiveButton class="min-h-12 px-5 whitespace-nowrap compact:w-full" variant="secondary" type="submit">
              {{ $t('privacyNotice.actions.save') }}
            </ArchiveButton>
            <ArchiveButton class="min-h-12 px-5 whitespace-nowrap compact:w-full" type="button" @click="acceptAllServices">
              {{ $t('privacyNotice.actions.acceptAll') }}
            </ArchiveButton>
          </div>
        </div>
      </form>
    </aside>
  </Transition>
</template>
