<script setup lang="ts">
// The one modal frame of the site: a dark layer over the page and the paper panel in its
// centre, with × at the top right. Escape, × and a click beside the panel ask to close (`close`);
// the parent owns `open`. While open, Tab stays inside the panel and the page does not scroll;
// on close the focus goes back where it was. Width and padding of the panel: `panelClass`.
const props = withDefaults(defineProps<{
  open: boolean
  /** Id of the panel, for an `aria-controls` on the button that opens it. */
  panelId?: string
  /** Id of the element that names the dialog (its heading). */
  labelledby: string
  /** Id of the element that describes the dialog, if any. */
  describedby?: string
  /** Accessible name of the × button. */
  closeLabel: string
  /** Width and padding of the panel, for example "max-w-2xl px-12 py-10". */
  panelClass?: string
}>(), {
  panelId: undefined,
  describedby: undefined,
  panelClass: ''
})

const emit = defineEmits<{
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<{ focus: () => void } | null>(null)
let previousBodyOverflow = ''
let previousFocus: HTMLElement | null = null

const requestClose = () => emit('close')

const trapFocus = (event: KeyboardEvent) => {
  const panel = panelRef.value
  if (!panel) return

  const focusable = [...panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hasAttribute('hidden'))

  if (!focusable.length) {
    event.preventDefault()
    panel.focus()
    return
  }

  const first = focusable[0]
  const last = focusable.at(-1)
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}

const release = () => {
  if (!import.meta.client) return
  document.body.style.overflow = previousBodyOverflow
  if (previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return

  if (open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeButtonRef.value?.focus()
  } else {
    release()
  }
})

onBeforeUnmount(() => {
  if (props.open) release()
})
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
          v-if="props.open"
          class="[ archive-modal-backdrop ] fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-archive-backdrop/80 px-4 py-8 compact:py-4"
          @click.self="requestClose"
          @keydown.esc="requestClose"
        >
          <section
            :id="props.panelId"
            ref="panelRef"
            class="[ archive-modal ] archive-modal-frame relative max-h-[calc(100dvh-4rem)] w-full overflow-y-auto border-16 border-transparent bg-transparent text-archive-ink drop-shadow-xl compact:max-h-[calc(100dvh-2rem)]"
            :class="props.panelClass"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="props.labelledby"
            :aria-describedby="props.describedby"
            tabindex="-1"
            @keydown.tab="trapFocus"
          >
            <ArchiveCloseButton
              ref="closeButtonRef"
              class="absolute top-5 right-5 z-1 size-10 text-archive-muted transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-red compact:top-3 compact:right-3 compact:size-9"
              :label="props.closeLabel"
              @click="requestClose"
            />
            <slot />
          </section>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
