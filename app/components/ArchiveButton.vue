<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary'
  to?: string
  href?: string
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  as?: 'button' | 'a' | 'span'
}>(), {
  variant: 'primary',
  to: undefined,
  href: undefined,
  target: undefined,
  rel: undefined,
  type: 'button',
  disabled: false,
  as: undefined
})

const element = computed(() => {
  if (props.as) return props.as
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const variantClasses = {
  primary: 'archive-button-primary-frame text-archive-light-ink hover:brightness-109 hover:contrast-102 hover:saturate-108',
  secondary: 'archive-button-secondary-frame text-archive-copy-warm hover:brightness-104 hover:contrast-102 hover:saturate-92'
} as const
</script>

<template>
  <component
    :is="element"
    class="[ archive-button ] inline-flex min-h-16 items-center justify-center gap-[0.8rem] rounded-none border-12 border-transparent bg-transparent px-7 py-0 font-display text-button font-normal shadow-none transition-[filter,transform,translate,scale,rotate] duration-[0.38s,0.14s] ease-[ease,cubic-bezier(0.4,0,0.2,1)] active:translate-y-px active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red disabled:cursor-not-allowed compact:min-h-12 compact:justify-center compact:gap-2 compact:px-4 compact:text-sm"
    :class="variantClasses[props.variant]"
    :to="props.to"
    :href="props.href"
    :target="props.target"
    :rel="props.rel"
    :type="element === 'button' ? props.type : undefined"
    :disabled="element === 'button' ? props.disabled : undefined"
  >
    <slot />
  </component>
</template>
