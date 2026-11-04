<script setup lang="ts">
// The frame of every page except the start page (it plays its own intro): the background ruler,
// the header, the page in <main>, the footer. Header and footer sit beside <main>, so each is its
// own landmark. overflow-clip, never overflow-hidden: hidden makes a scroll box and the sticky
// header would scroll away with the page.
const active = useNavActive()
</script>

<template>
  <div class="[ site-shell ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-clip">
    <ArchivePageChrome />
    <ArchiveHeader :active="active" />
    <main id="main-content">
      <slot />
    </main>
    <ArchiveFooter />
  </div>
</template>
