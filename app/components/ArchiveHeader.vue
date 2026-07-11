<script setup lang="ts">
const props = withDefaults(defineProps<{
  active?: 'archive' | 'galleries' | 'artists' | 'exhibitions' | 'about'
  skipTarget?: string
}>(), {
  active: undefined,
  skipTarget: 'main-content'
})

const menuOpen = ref(false)
const route = useRoute()

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

const links = [
  { label: 'Archive', to: '/#locations', key: 'archive' },
  { label: 'Galleries', to: '/locations/parkschloessl-spittal-drau/', key: 'galleries' },
  { label: 'Artists', to: '/#artists', key: 'artists' },
  { label: 'Exhibitions', to: '/#exhibitions', key: 'exhibitions' },
  { label: 'About', to: '/#method', key: 'about' }
] as const
</script>

<template>
  <header class="site-header">
    <a class="skip-link" :href="`#${props.skipTarget}`">Skip to content</a>
    <NuxtLink class="brand" to="/" aria-label="PERMAPHEMERA home">PERMAPHEMERA</NuxtLink>
    <nav class="desktop-nav" aria-label="Primary navigation">
      <NuxtLink
        v-for="link in links"
        :key="link.key"
        :to="link.to"
        :aria-current="props.active === link.key ? 'page' : undefined"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
    <div class="header-actions">
      <div class="language-switch" aria-label="Language switcher">
        <a href="/" aria-current="page">EN</a>
        <span>/</span>
        <a href="/">DE</a>
      </div>
      <button
        class="icon-button mobile-menu"
        type="button"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        aria-controls="mobile-primary-navigation"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="svg-icon svg-icon-menu" aria-hidden="true" />
      </button>
      <span class="desktop-compass svg-icon svg-icon-menu" aria-hidden="true" />
    </div>
    <nav
      id="mobile-primary-navigation"
      class="mobile-nav"
      :class="{ 'is-open': menuOpen }"
      aria-label="Mobile primary navigation"
      :aria-hidden="!menuOpen"
    >
      <NuxtLink
        v-for="(link, index) in links"
        :key="link.key"
        :to="link.to"
        :tabindex="menuOpen ? 0 : -1"
        :aria-current="props.active === link.key ? 'page' : undefined"
        @click="menuOpen = false"
      >
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
