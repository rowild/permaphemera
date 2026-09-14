<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'desktop' | 'drawer'
}>(), {
  variant: 'desktop'
})

const rootElement = computed(() => props.variant === 'desktop' ? 'section' : 'div')
// Five desktop columns: identity, the three footer groups, seal. check:data guarantees exactly explore/information/legal; a fourth group is a design change here, not a data change.
const rootClasses = computed(() => props.variant === 'desktop'
  ? 'archive-footer-link-grid relative z-1 mx-auto grid max-w-384 grid-cols-[1.35fr_repeat(3,minmax(9rem,0.72fr))_16rem] gap-0 border-y border-archive-ochre/20 py-[3.2rem] *:relative *:min-w-0 *:px-[2.4rem] *:first:pl-0 *:last:pr-0 tablet:hidden'
  : 'relative z-1 grid grid-cols-2 gap-x-4 gap-y-5')
const { show: showCookieNotice } = useCookieNotice()
const navigation = useSiteNavigation()
const footerGroups = computed(() => navigation.value.footer)
const isLegal = (key: string) => key === 'legal'

const runAction = (action?: string) => {
  if (action === 'cookie-settings') showCookieNotice()
}
</script>

<template>
  <component :is="rootElement" class="[ footer-menu ]" :class="rootClasses">
    <ArchiveFooterIdentity v-if="props.variant === 'desktop'" />
    <div v-else class="[ footer-menu-language ] col-span-2 flex justify-end border-b border-archive-ochre/20 pb-4">
      <ArchiveLanguageSwitch inverted />
    </div>

    <ArchiveFooterNav
      v-for="group in footerGroups"
      :key="group.key"
      :title="group.label"
      :ariaLabel="$t(`footer.${group.key}Aria`)"
      :compact-columns="props.variant === 'drawer' && isLegal(group.key)"
      :class="props.variant === 'drawer' && isLegal(group.key) ? 'col-span-2 border-t border-archive-ochre/20 pt-4' : ''"
    >
      <template v-for="link in group.links" :key="link.key">
        <NuxtLink v-if="link.kind === 'route'" :to="link.to">{{ link.label }}</NuxtLink>
        <a v-else-if="link.kind === 'url'" :href="link.href" :target="link.target" rel="noopener">{{ link.label }}</a>
        <button v-else class="cursor-pointer border-0 bg-transparent p-0 text-left" type="button" @click="runAction(link.action)">{{ link.label }}</button>
      </template>
    </ArchiveFooterNav>
    <img v-if="props.variant === 'desktop'" class="[ footer-seal ] w-62 max-w-full self-center opacity-90 mix-blend-screen" src="/media/images/landing/footer/permanently-preserved-stamp.png" :alt="$t('footer.sealAlt')" />
  </component>
</template>
