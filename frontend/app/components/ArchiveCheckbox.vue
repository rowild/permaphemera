<script setup lang="ts">
// One checkbox row: the box, a title (or rich slot content), an optional note and badge.
// Used by the cookie notice and the newsletter form.
const props = withDefaults(defineProps<{
  title?: string
  note?: string
  /** A small capital tag after the title ("Immer aktiv"). */
  badge?: string
  /** `small`: running text such as a consent sentence. */
  size?: 'default' | 'small'
  disabled?: boolean
  required?: boolean
  /** The half state of a group box when only some of its items are chosen. */
  indeterminate?: boolean
  describedby?: string
  /** The input's value attribute (what the box stands for, e.g. a town slug). */
  value?: string
}>(), {
  value: undefined,
  title: undefined,
  note: undefined,
  badge: undefined,
  size: 'default',
  disabled: false,
  required: false,
  indeterminate: false,
  describedby: undefined
})

const model = defineModel<boolean>({ default: false })

const titleClasses = {
  default: 'font-display text-base text-archive-ink',
  small: 'text-sm leading-relaxed text-archive-body'
} as const
</script>

<template>
  <label class="[ archive-checkbox ] grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3" :class="{ 'cursor-pointer': !props.disabled }">
    <input
      v-model="model"
      class="mt-1 size-5 shrink-0 accent-archive-red"
      :class="{ 'cursor-pointer': !props.disabled }"
      type="checkbox"
      :value="props.value"
      :disabled="props.disabled"
      :required="props.required"
      :indeterminate="props.indeterminate"
      :aria-describedby="props.describedby"
    >
    <span class="min-w-0">
      <span class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span data-part="title" :class="titleClasses[props.size]"><slot>{{ props.title }}</slot></span>
        <span v-if="props.badge" class="font-display text-xs tracking-widest text-archive-muted uppercase">{{ props.badge }}</span>
      </span>
      <span v-if="props.note" class="block text-xs leading-snug text-archive-muted">{{ props.note }}</span>
    </span>
  </label>
</template>
