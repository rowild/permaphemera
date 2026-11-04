<script setup lang="ts">
// The framed "Keine Treffer" block of a list, with a way back: a button (`action`, e.g. clear the
// search) or, with `to`, a link (a locale-neutral path).
const props = withDefaults(defineProps<{
  message: string
  actionLabel?: string
  to?: string
}>(), {
  actionLabel: undefined,
  to: undefined
})

const emit = defineEmits<{ action: [] }>()
const localePath = useLocalePath()
</script>

<template>
  <div class="[ empty-state ] border-y border-archive-rule-deep/24 py-16 text-center">
    <p class="m-0 text-title text-archive-ink">{{ props.message }}</p>
    <template v-if="props.actionLabel">
      <ArchiveTextLink v-if="props.to" class="mt-4" :to="localePath(props.to)">{{ props.actionLabel }}</ArchiveTextLink>
      <button v-else class="mt-4 border-0 bg-transparent p-0 text-archive-red underline underline-offset-4" type="button" @click="emit('action')">{{ props.actionLabel }}</button>
    </template>
  </div>
</template>
