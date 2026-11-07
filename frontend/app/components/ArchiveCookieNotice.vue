<script setup lang="ts">
const localePath = useLocalePath()
const {
  isVisible,
  googleMapsConsent,
  youtubeConsent,
  initialize,
  savePreferences,
  acceptAll
} = useCookieNotice()

const googleMapsSelected = ref(false)
const youtubeSelected = ref(false)

const syncSelection = () => {
  googleMapsSelected.value = googleMapsConsent.value === 'granted'
  youtubeSelected.value = youtubeConsent.value === 'granted'
}

const saveSelection = () => {
  savePreferences({
    googleMaps: googleMapsSelected.value,
    youtube: youtubeSelected.value
  })
}

const acceptAllServices = () => {
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

          <ArchiveCheckbox
            :model-value="true"
            disabled
            :title="$t('privacyNotice.necessary.title')"
            :badge="$t('privacyNotice.alwaysActive')"
            :note="$t('privacyNotice.necessary.description')"
          />
          <ArchiveCheckbox v-model="googleMapsSelected" :title="$t('privacyNotice.googleMaps.title')" :note="$t('privacyNotice.googleMaps.description')" />
          <ArchiveCheckbox v-model="youtubeSelected" :title="$t('privacyNotice.youtube.title')" :note="$t('privacyNotice.youtube.description')" />
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
