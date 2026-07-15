<script setup lang="ts">
import type { Artist, ArtistRecordLink } from '~/types/content'

const props = defineProps<{
  artist: Artist
  displayName: string
  records: ArtistRecordLink[]
  open: boolean
  modalId: string
}>()

const emit = defineEmits<{
  close: []
}>()
const localePath = useLocalePath()

const dialogRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previousBodyOverflow = ''

const requestClose = () => emit('close')

const trapFocus = (event: KeyboardEvent) => {
  const dialog = dialogRef.value
  if (!dialog) return

  const focusableElements = [...dialog.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hasAttribute('hidden'))

  if (!focusableElements.length) {
    event.preventDefault()
    dialog.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)
  const activeElement = document.activeElement

  if (event.shiftKey && (activeElement === firstElement || activeElement === dialog)) {
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

watch(() => props.open, async (open) => {
  if (!import.meta.client) return

  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeButtonRef.value?.focus()
  } else {
    restoreBodyScroll()
  }
})

onBeforeUnmount(restoreBodyScroll)
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0"
      >
        <div
          v-if="props.open && props.records.length"
          class="[ artist-exhibition-modal-backdrop ] fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-archive-backdrop/80 px-4 py-8 compact:py-4"
          @click.self="requestClose"
          @keydown.esc="requestClose"
        >
          <section
            :id="props.modalId"
            ref="dialogRef"
            class="[ artist-exhibition-modal ] archive-modal-frame relative max-h-[calc(100dvh-4rem)] w-full max-w-2xl overflow-y-auto border-16 border-transparent bg-transparent px-[clamp(1.5rem,4vw,3rem)] py-[clamp(1.5rem,4vw,2.75rem)] text-archive-ink drop-shadow-xl compact:max-h-[calc(100dvh-2rem)] compact:px-4 compact:py-4"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="`${props.modalId}-title`"
            tabindex="-1"
            @keydown.tab="trapFocus"
          >
            <button
              ref="closeButtonRef"
              class="[ artist-exhibition-modal-close ] absolute top-5 right-5 grid size-10 place-items-center border-0 bg-transparent p-0 font-display text-2xl leading-none text-archive-muted transition-colors duration-150 hover:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:top-3 compact:right-3 compact:size-9 compact:text-xl"
              type="button"
              :aria-label="$t('artists.closeFor', { name: props.artist.name })"
              @click="requestClose"
            >
              <span aria-hidden="true">&#215;</span>
            </button>

            <header class="pr-12 compact:pr-9">
              <p class="[ eyebrow ] archive-section-eyebrow m-0 mb-3 inline-flex items-center gap-[0.7rem] font-display text-sm font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('artists.linkedExhibitions') }}</p>
              <h2 :id="`${props.modalId}-title`" class="m-0 font-display text-[clamp(2.2rem,5vw,3.8rem)] font-normal leading-none compact:text-3xl">
                {{ props.displayName }}
              </h2>
              <p v-if="props.artist.location || props.artist.years" class="mt-3 mb-0 text-sm text-archive-muted">
                {{ [props.artist.location, props.artist.years].filter(Boolean).join(' · ') }}
              </p>
            </header>

            <div class="[ artist-exhibition-modal-actions ] mt-8 grid max-h-96 gap-3 overflow-y-auto overscroll-contain pr-1 compact:mt-5 compact:gap-2">
              <ArchiveButton
                v-for="record in props.records"
                :key="record.id"
                :to="localePath(record.href)"
                class="w-full justify-between text-left"
                @click="requestClose"
              >
                <span class="min-w-0">
                  <span class="block text-[1.08rem] leading-tight compact:text-sm">{{ record.title }}</span>
                  <span class="mt-1 block text-xs tracking-wide text-archive-light-ink/75">{{ [record.venue, record.city].filter(Boolean).join(' · ') }}</span>
                </span>
                <ArchiveArrow class="ml-auto shrink-0" />
              </ArchiveButton>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
