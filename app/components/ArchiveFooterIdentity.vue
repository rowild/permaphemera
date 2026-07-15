<script setup lang="ts">
withDefaults(defineProps<{
  showLanguage?: boolean
}>(), {
  showLanguage: true
})

const localePath = useLocalePath()
</script>

<template>
  <div class="[ footer-brand ]">
    <NuxtLink class="[ footer-brand-lockup ] group/footer-brand mb-[0.65rem] inline-flex items-center gap-[0.65rem] no-underline transition-colors duration-150 ease-out hover:text-archive-red focus-visible:text-archive-red focus-visible:no-underline" :to="localePath('/')" :aria-label="$t('site.homeAria')">
      <span class="[ footer-brand-mark ] archive-footer-brand-mark size-8 flex-none bg-archive-ochre opacity-90 transition-colors duration-150 ease-out group-hover/footer-brand:bg-archive-red group-focus-visible/footer-brand:bg-archive-red" aria-hidden="true" />
      <strong class="m-0 block font-display text-[1.7rem] font-medium tracking-[0.16em] compact:text-xl compact:tracking-widest">PERMAPHEMERA</strong>
    </NuxtLink>
    <span class="[ footer-brand-rule ] archive-footer-brand-rule mb-5 block aspect-65/10 w-[4.1rem] bg-archive-ochre opacity-52 compact:mb-3" aria-hidden="true" />
    <p class="mb-8 max-w-72 font-display text-[1.05rem] text-archive-footer-copy/86 compact:mb-0 compact:text-sm">{{ $t('footer.tagline') }}</p>
    <div v-if="showLanguage" class="[ footer-language ] flex justify-end">
      <ArchiveLanguageSwitch inverted />
    </div>
  </div>
</template>
