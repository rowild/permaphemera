<script setup lang="ts">
// A labelled text input in the archive's field frame (the frame of the search fields).
const props = withDefaults(defineProps<{
  id: string
  label: string
  type?: 'text' | 'email'
  autocomplete?: string
  required?: boolean
  describedby?: string
}>(), {
  type: 'text',
  autocomplete: undefined,
  required: false,
  describedby: undefined
})

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="[ archive-text-field ] grid min-w-0 gap-1">
    <label class="font-display text-sm tracking-widest text-archive-red uppercase compact:text-xs" :for="props.id">{{ props.label }}</label>
    <div class="archive-search-field-frame flex min-h-14 min-w-0 items-center border-12 border-transparent bg-transparent px-3 compact:min-h-12 compact:px-2">
      <input
        :id="props.id"
        v-model="model"
        class="w-full min-w-0 border-0 bg-transparent font-display text-base text-archive-ink outline-0"
        :name="props.id"
        :type="props.type"
        :autocomplete="props.autocomplete"
        :required="props.required"
        :aria-describedby="props.describedby"
      >
    </div>
  </div>
</template>
