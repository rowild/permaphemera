<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'desktop' | 'drawer'
}>(), {
  variant: 'desktop'
})

const rootElement = computed(() => props.variant === 'desktop' ? 'section' : 'div')
const rootClasses = computed(() => props.variant === 'desktop'
  ? 'archive-footer-link-grid relative z-1 mx-auto grid max-w-384 grid-cols-[1.35fr_repeat(3,minmax(9rem,0.72fr))_16rem] gap-0 border-y border-archive-ochre/20 py-[3.2rem] *:relative *:min-w-0 *:px-[2.4rem] *:first:pl-0 *:last:pr-0 tablet:hidden'
  : 'relative z-1 grid grid-cols-2 gap-x-4 gap-y-5')
const localePath = useLocalePath()
const { show: showCookieNotice } = useCookieNotice()
</script>

<template>
  <component :is="rootElement" class="[ footer-menu ]" :class="rootClasses">
    <ArchiveFooterIdentity v-if="props.variant === 'desktop'" />
    <div v-else class="[ footer-menu-language ] col-span-2 flex justify-end border-b border-archive-ochre/20 pb-4">
      <ArchiveLanguageSwitch inverted />
    </div>

    <ArchiveFooterNav :title="$t('footer.explore')" :aria-label="$t('footer.exploreAria')">
      <NuxtLink :to="localePath('/venues/')">{{ $t('navigation.galleries') }}</NuxtLink>
      <NuxtLink :to="localePath('/artists/')">{{ $t('navigation.artists') }}</NuxtLink>
      <NuxtLink :to="localePath('/exhibitions/')">{{ $t('navigation.exhibitions') }}</NuxtLink>
    </ArchiveFooterNav>
    <ArchiveFooterNav :title="$t('navigation.information')" :aria-label="$t('footer.informationAria')">
      <NuxtLink :to="localePath('/#method')">{{ $t('navigation.about') }}</NuxtLink>
      <NuxtLink :to="localePath('/#method')">{{ $t('navigation.howItWorks') }}</NuxtLink>
      <a href="mailto:archive@example.test">{{ $t('navigation.contact') }}</a>
    </ArchiveFooterNav>
    <ArchiveFooterNav
      :title="$t('footer.legal')"
      :aria-label="$t('footer.legalAria')"
      :compact-columns="props.variant === 'drawer'"
      :class="props.variant === 'drawer' ? 'col-span-2 border-t border-archive-ochre/20 pt-4' : ''"
    >
      <NuxtLink :to="localePath('/')">{{ $t('footer.imprint') }}</NuxtLink>
      <NuxtLink :to="localePath('/')">{{ $t('footer.privacy') }}</NuxtLink>
      <NuxtLink :to="localePath('/')">{{ $t('footer.terms') }}</NuxtLink>
      <NuxtLink :to="localePath('/')">{{ $t('footer.accessibility') }}</NuxtLink>
      <button class="cursor-pointer border-0 bg-transparent p-0 text-left" type="button" @click="showCookieNotice">{{ $t('footer.cookies') }}</button>
    </ArchiveFooterNav>
    <img v-if="props.variant === 'desktop'" class="[ footer-seal ] w-62 max-w-full self-center opacity-90 mix-blend-screen" src="/media/images/landing/footer/permanently-preserved-stamp.png" :alt="$t('footer.sealAlt')" />
  </component>
</template>
