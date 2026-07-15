<script setup lang="ts">
const { isVisible, initialize, dismiss } = useCookieNotice()

onMounted(initialize)
</script>

<template>
  <aside
    v-if="isVisible"
    class="[ cookie-notice ] archive-modal-frame fixed right-6 bottom-6 left-6 z-40 mx-auto max-w-2xl border-16 border-transparent bg-transparent px-6 py-5 text-archive-ink drop-shadow-xl compact:right-3 compact:bottom-3 compact:left-3 compact:px-4 compact:py-4"
    role="status"
    aria-live="polite"
  >
    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 compact:grid-cols-1 compact:gap-4">
      <div class="min-w-0">
        <p class="m-0 mb-2 font-display text-sm font-medium tracking-widest text-archive-red uppercase compact:text-xs">
          {{ $t('privacyNotice.title') }}
        </p>
        <p class="m-0 max-w-xl text-sm leading-relaxed text-archive-body">
          {{ $t('privacyNotice.description') }}
        </p>
      </div>

      <ArchiveButton class="min-h-12 whitespace-nowrap compact:w-full" type="button" @click="dismiss">
        {{ $t('privacyNotice.actions.accept') }}
      </ArchiveButton>
    </div>
  </aside>
</template>
