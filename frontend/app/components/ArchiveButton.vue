<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary'
  /** `small`: a narrow card's action (two side by side in a mobile slide card). */
  size?: 'default' | 'small'
  to?: string
  href?: string
  target?: string
  rel?: string
  ariaDescribedby?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  as?: 'button' | 'a' | 'span'
}>(), {
  variant: 'primary',
  size: 'default',
  to: undefined,
  href: undefined,
  target: undefined,
  rel: undefined,
  ariaDescribedby: undefined,
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

const sizeClasses = {
  default: 'min-h-16 gap-[0.8rem] px-7 text-button compact:min-h-12 compact:gap-2 compact:px-4 compact:text-sm',
  small: 'min-h-11 gap-1 px-1.5 text-xs'
} as const
</script>

<template>
  <component
    :is="element"
    class="[ archive-button ] inline-flex items-center justify-center rounded-none border-12 border-transparent bg-transparent py-0 font-display font-normal shadow-none transition-[filter,transform,translate,scale,rotate] duration-[0.38s,0.14s] ease-[ease,cubic-bezier(0.4,0,0.2,1)] active:translate-y-px active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red disabled:cursor-not-allowed compact:justify-center"
    :class="[variantClasses[props.variant], sizeClasses[props.size]]"
    :to="props.to"
    :href="props.href"
    :target="props.target"
    :rel="props.rel"
    :aria-describedby="props.ariaDescribedby"
    :type="element === 'button' ? props.type : undefined"
    :disabled="element === 'button' ? props.disabled : undefined"
  >
    <slot />
  </component>
</template>
