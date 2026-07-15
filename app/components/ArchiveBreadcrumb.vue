<template>
  <nav
    class="[ breadcrumb ] mb-10 flex flex-wrap gap-[0.55rem] text-[0.9rem] text-archive-muted compact:mb-4 compact:gap-2 compact:text-sm"
    :aria-label="$t('common.breadcrumb')"
  >
    <slot />
  </nav>
</template>
