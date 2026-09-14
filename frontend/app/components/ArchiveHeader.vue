<script setup lang="ts">
const props = withDefaults(defineProps<{
  // Keys of pp_navigations main items; check:data pins them.
  active?: 'archive' | 'galleries' | 'artists' | 'exhibitions' | 'about'
  skipTarget?: string
}>(), {
  active: undefined,
  skipTarget: 'main-content'
})

const menuOpen = ref(false)
const route = useRoute()
const localePath = useLocalePath()
const { show: showCookieNotice } = useCookieNotice()
const navigation = useSiteNavigation()

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

// Main menu from pp_navigations `main`; the popup shows the footer's
// information and legal groups, exactly the two secondary blocks it had before.
// Some of those footer children (e.g. "about") also appear in the primary
// list, so exclude anything already shown there to avoid listing it twice.
const primaryLinks = computed(() => navigation.value.main)
const secondaryGroups = computed(() => {
  const mainKeys = new Set(navigation.value.main.map((l) => l.key))
  return navigation.value.footer
    .filter((group) => ['information', 'legal'].includes(group.key))
    .map((group) => ({ ...group, links: group.links.filter((l) => !mainKeys.has(l.key)) }))
})

const runAction = (action?: string) => {
  menuOpen.value = false
  if (action === 'cookie-settings') showCookieNotice()
}
</script>

<template>
  <header class="[ site-header ] archive-header-surface sticky top-0 z-30 grid min-h-[6.4rem] grid-cols-[auto_minmax(0,1fr)_auto] content-center items-baseline px-[clamp(1.4rem,5vw,5.2rem)] pt-3 tablet:min-h-24 tablet:grid-cols-[1fr_auto] tablet:items-center tablet:pt-3 compact:min-h-16 compact:grid-cols-[minmax(0,1fr)_auto] compact:content-start compact:gap-y-0 compact:px-4 compact:pt-2 compact:pb-0">
    <a class="[ skip-link ] absolute left-5 -top-20 z-60 border border-archive-red bg-archive-paper px-4 py-[0.7rem] text-archive-ink focus:top-[0.65rem]" :href="`#${props.skipTarget}`">{{ $t('site.skipToContent') }}</a>
    <p class="[ header-eyebrow ] col-span-full m-0 translate-y-1 self-end pl-[2.65rem] font-display text-3xs leading-none font-medium tracking-widest text-archive-red/82 compact:translate-y-2 compact:pl-8 narrow:pl-7">
      {{ $t('site.headerTagline') }}
    </p>
    <NuxtLink class="[ brand ] inline-flex items-baseline gap-[0.65rem] justify-self-start font-display text-brand leading-none font-medium tracking-[0.24em] compact:gap-2 compact:text-xl compact:tracking-widest compact:whitespace-nowrap narrow:text-base narrow:tracking-[0.08em]" :to="localePath('/')" :aria-label="$t('site.homeAria')">
      <img
        class="[ brand-mark ] size-8 flex-none translate-y-0.5 self-baseline object-contain opacity-82 compact:size-6 narrow:size-5"
        src="/media/svg/brand/archive-temple.svg"
        alt=""
        width="64"
        height="64"
      >
      <span>PERMAPHEMERA</span>
    </NuxtLink>
    <nav class="[ desktop-nav ] archive-primary-nav ml-[clamp(3.5rem,5vw,6rem)] flex items-baseline gap-[clamp(0.75rem,1.2vw,1.25rem)] justify-self-start self-baseline font-display text-lg leading-none font-normal whitespace-nowrap tablet:hidden" :aria-label="$t('navigation.primaryAria')">
      <template v-for="(link, index) in primaryLinks" :key="link.key">
        <NuxtLink
          class="archive-navigation-link relative no-underline transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red current-page:text-archive-red"
          :to="link.to"
          :aria-current="props.active === link.key ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>
        <img
          v-if="index < primaryLinks.length - 1"
          class="[ desktop-nav-divider ] size-1.5 self-center object-contain opacity-55"
          src="/media/svg/frames/sponsor-strip-frame.svg"
          alt=""
          aria-hidden="true"
        >
      </template>
    </nav>
    <div class="[ header-actions ] flex items-center justify-end justify-self-end self-center gap-[1.4rem] compact:gap-2">
      <ArchiveLanguageSwitch @click="menuOpen = false" />
      <button
        class="[ mobile-menu ] inline-flex min-h-11 w-11 items-center justify-end border-0 bg-transparent text-archive-ink"
        type="button"
        :aria-label="menuOpen ? $t('navigation.closeMenu') : $t('navigation.openMenu')"
        aria-controls="mobile-primary-navigation"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="svg-icon svg-icon-menu inline-block size-[1.65rem] flex-none bg-current compact:size-5" aria-hidden="true" />
      </button>
    </div>
    <Transition name="archive-header-menu">
      <ArchiveTooltipFrame
        v-if="menuOpen"
        id="mobile-primary-navigation"
        as="nav"
        class="[ mobile-nav ] archive-header-menu-frame absolute top-[calc(100%-0.2rem)] right-[clamp(1.4rem,5vw,5.2rem)] z-40 isolate w-[min(34rem,calc(100vw-2.8rem))] p-0 filter-[drop-shadow(0_0.8rem_0.9rem_rgba(66,43,22,0.18))] tablet:right-[clamp(1.15rem,4vw,2rem)] tablet:left-[clamp(1.15rem,4vw,2rem)] tablet:w-auto compact:right-[0.7rem] compact:left-[0.7rem]"
        pointer-side="top"
        :pointer-offset="999"
        :aria-label="$t('navigation.mobileAria')"
        @keydown.esc="menuOpen = false"
      >
        <div class="archive-header-menu-surface relative z-1 grid overflow-hidden">
          <div class="[ mobile-nav-primary ] hidden tablet:grid gap-1 px-4 pt-4 compact:px-3 compact:pt-3">
        <NuxtLink
          v-for="(link, index) in primaryLinks"
          :key="link.key"
          class="archive-mobile-navigation-link flex items-baseline gap-4 px-1 py-[0.65rem] text-lg text-archive-ink transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red current-page:text-archive-red focus-visible:outline-2 focus-visible:outline-offset-[0.22rem] focus-visible:outline-archive-red compact:gap-3 compact:py-2 compact:text-base"
          :to="link.to"
          :aria-current="props.active === link.key ? 'page' : undefined"
          @click="menuOpen = false"
        >
          <span class="text-xs tracking-[0.08em] text-archive-red">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="archive-navigation-link relative">{{ link.label }}</span>
        </NuxtLink>
          </div>

          <div class="[ mobile-nav-secondary ] grid grid-cols-2 gap-6 px-4 py-4 compact:gap-4 compact:px-3 compact:py-3">
        <div v-for="group in secondaryGroups" :key="group.key" class="[ mobile-nav-group ] grid content-start gap-2.5" :data-group="group.key">
          <p class="m-0 mb-1 font-display text-xs tracking-widest text-archive-red uppercase">{{ group.label }}</p>
          <template v-for="link in group.links" :key="link.key">
            <NuxtLink v-if="link.kind === 'route'" class="archive-navigation-link relative w-fit font-display text-base text-archive-ink no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red current-page:text-archive-red" :to="link.to" @click="menuOpen = false">{{ link.label }}</NuxtLink>
            <a v-else-if="link.kind === 'url'" class="archive-navigation-link relative w-fit font-display text-base text-archive-ink no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red" :href="link.href" :target="link.target" rel="noopener">{{ link.label }}</a>
            <button v-else class="archive-navigation-link relative w-fit cursor-pointer border-0 bg-transparent p-0 font-display text-base text-archive-ink transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red" type="button" @click="runAction(link.action)">{{ link.label }}</button>
          </template>
        </div>
          </div>
        </div>
      </ArchiveTooltipFrame>
    </Transition>
  </header>
</template>
