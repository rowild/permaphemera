<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import austrianFlagUrl from 'flag-icons/flags/4x3/at.svg'
import britishFlagUrl from 'flag-icons/flags/4x3/gb.svg'

type SupportedLocale = 'en' | 'de'

const props = withDefaults(defineProps<{
  inverted?: boolean
}>(), {
  inverted: false
})

const { locale, locales, setLocale, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const localePreference = useCookie<string>('permaphemera-locale', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax'
})
const rootElement = ref<HTMLElement | null>(null)
const triggerElement = ref<HTMLButtonElement | null>(null)
const menuOpen = ref(false)
const switching = ref(false)

const languageDetails: Record<SupportedLocale, { name: string; flagUrl: string }> = {
  de: { name: 'Deutsch', flagUrl: austrianFlagUrl },
  en: { name: 'English', flagUrl: britishFlagUrl }
}

const isSupportedLocale = (code: string): code is SupportedLocale => code === 'de' || code === 'en'

const languages = computed(() => (locales.value as Array<{ code: string }>).flatMap(({ code }) => {
  if (!isSupportedLocale(code)) return []

  return [{
    code,
    label: code.toUpperCase(),
    ...languageDetails[code]
  }]
}))

const currentLanguage = computed(() => {
  const currentCode = isSupportedLocale(locale.value) ? locale.value : 'de'
  return {
    code: currentCode,
    label: currentCode.toUpperCase(),
    ...languageDetails[currentCode]
  }
})

const closeMenu = () => {
  menuOpen.value = false
}

const focusMenuOption = async (position: 'first' | 'last' | 'selected') => {
  await nextTick()
  const options = [...(rootElement.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])]
  const target = position === 'selected'
    ? options.find((option) => option.ariaChecked === 'true') ?? options[0]
    : position === 'last' ? options.at(-1) : options[0]
  target?.focus()
}

const closeMenuAndRestoreFocus = async () => {
  closeMenu()
  await nextTick()
  triggerElement.value?.focus()
}

const handleTriggerKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    await closeMenuAndRestoreFocus()
    return
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  menuOpen.value = true
  await focusMenuOption(event.key === 'ArrowUp' ? 'last' : 'selected')
}

const handleMenuKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    await closeMenuAndRestoreFocus()
    return
  }

  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const options = [...(rootElement.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])]
  const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement)
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? options.length - 1
      : event.key === 'ArrowUp'
        ? (currentIndex - 1 + options.length) % options.length
        : (currentIndex + 1) % options.length
  options[nextIndex]?.focus()
}

const switchLanguage = async (localeCode: SupportedLocale) => {
  closeMenu()
  if (locale.value === localeCode || switching.value) return

  switching.value = true

  try {
    const targetPath = switchLocalePath(localeCode)
    localePreference.value = localeCode
    await setLocale(localeCode)
    await navigateTo(targetPath)
  } finally {
    switching.value = false
  }
}

const handlePointerDown = (event: PointerEvent) => {
  if (!rootElement.value?.contains(event.target as Node)) closeMenu()
}

watch(() => route.fullPath, closeMenu)

onMounted(() => document.addEventListener('pointerdown', handlePointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handlePointerDown))
</script>

<template>
  <div
    ref="rootElement"
    class="[ language-switcher ] relative inline-flex font-display leading-none"
    :class="props.inverted ? 'text-archive-footer-copy/88' : 'text-archive-muted'"
  >
    <button
      ref="triggerElement"
      class="[ language-switcher-trigger ] group/language inline-flex min-h-10 cursor-pointer items-center gap-2 border-0 bg-transparent px-1 py-1 text-sm text-inherit transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red disabled:cursor-default compact:min-h-9 compact:gap-1.5 compact:px-0.5 compact:text-xs"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="menuOpen"
      :aria-label="t('language.currentAria', { language: currentLanguage.name })"
      :disabled="switching"
      @click="menuOpen = !menuOpen"
      @keydown="handleTriggerKeydown"
    >
      <img
        class="archive-language-flag h-3.5 w-5 flex-none border border-current/18 object-cover"
        :src="currentLanguage.flagUrl"
        alt=""
        aria-hidden="true"
      >
      <span>{{ currentLanguage.label }}</span>
      <ChevronDown
        class="size-3.5 flex-none transition-transform duration-150 ease-out"
        :class="menuOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <Transition name="archive-language-menu">
      <ArchiveTooltipFrame
        v-if="menuOpen"
        as="div"
        class="[ language-switcher-menu ] archive-language-menu absolute right-0 z-50 grid min-w-44 p-0 filter-[drop-shadow(0_0.5rem_0.62rem_rgba(75,52,29,0.2))]"
        :class="props.inverted ? 'is-inverted bottom-full mb-2' : 'top-full mt-2'"
        :pointer-side="props.inverted ? 'bottom' : 'top'"
        :pointer-offset="58"
        role="menu"
        :aria-label="$t('language.switcherAria')"
        @keydown="handleMenuKeydown"
      >
        <button
          v-for="language in languages"
          :key="language.code"
          class="[ language-switcher-option ] group/language-option grid min-h-9 cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 border-0 bg-transparent px-2 py-1 text-left font-display text-base text-archive-ink transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red disabled:cursor-default"
          type="button"
          role="menuitemradio"
          :aria-checked="locale === language.code"
          :disabled="switching"
          @click="switchLanguage(language.code)"
        >
          <img
            class="archive-language-flag h-3.5 w-5 border border-current/18 object-cover"
            :src="language.flagUrl"
            alt=""
            aria-hidden="true"
          >
          <span>{{ language.name }}</span>
          <span class="text-xs tracking-widest" :class="locale === language.code ? 'text-archive-red' : 'text-archive-muted'">{{ language.label }}</span>
        </button>
      </ArchiveTooltipFrame>
    </Transition>
  </div>
</template>
