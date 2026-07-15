<script setup lang="ts">
import { Search } from '@lucide/vue'

const props = defineProps<{
  id: string
  label: string
  placeholder: string
  buttonLabel?: string
}>()

const model = defineModel<string>({ default: '' })
const { t } = useI18n()
const resolvedButtonLabel = computed(() => props.buttonLabel ?? t('common.search'))
</script>

<template>
  <form
    class="[ archive-search-form ] relative z-1 my-[2.1rem] mx-[clamp(0.5rem,4vw,4rem)] flex min-h-16 w-auto max-w-none items-center gap-[0.65rem] border-0 bg-transparent p-0 text-archive-red shadow-none compact:mx-0 compact:my-4 compact:min-h-12 compact:w-full compact:flex-nowrap compact:gap-2"
    role="search"
    @submit.prevent
  >
    <div class="[ search-field ] archive-search-field-frame flex min-h-16 min-w-0 flex-auto items-center gap-4 border-12 border-transparent bg-transparent px-[1.15rem] shadow-none compact:min-h-12 compact:gap-2 compact:px-2">
      <Search class="ml-[0.35rem] size-6 flex-none compact:ml-0 compact:size-5" aria-hidden="true" />
      <label class="sr-only" :for="props.id">{{ props.label }}</label>
      <input
        :id="props.id"
        v-model="model"
        class="min-w-0 flex-1 border-0 bg-transparent font-display text-base text-archive-ink outline-0 compact:text-sm"
        :name="props.id"
        type="search"
        :placeholder="props.placeholder"
      />
    </div>
    <button
      class="[ search-submit ] archive-button-primary-frame inline-flex h-[3.55rem] min-h-0 w-46 min-w-46 shrink-0 flex-nowrap items-center justify-center gap-[0.8rem] self-center rounded-none border-12 border-transparent bg-transparent px-[1.45rem] font-display text-[1.04rem] font-normal whitespace-nowrap text-archive-light-ink shadow-none transition-[filter,transform] duration-[0.38s,0.14s] ease-[ease,cubic-bezier(0.4,0,0.2,1)] hover:brightness-109 hover:contrast-102 hover:saturate-108 active:translate-y-px active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-[0.28rem] focus-visible:outline-archive-red compact:size-12 compact:min-w-12 compact:gap-0 compact:p-0"
      type="submit"
      :aria-label="resolvedButtonLabel"
    >
      <span class="flex-none compact:sr-only">{{ resolvedButtonLabel }}</span>
      <ArchiveArrow class="flex-none compact:hidden" />
      <Search class="hidden size-5 compact:block" aria-hidden="true" />
    </button>
  </form>
</template>
