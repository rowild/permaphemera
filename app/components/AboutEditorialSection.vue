<script setup lang="ts">
const props = withDefaults(defineProps<{
  eyebrow: string
  title: string
  accent: string
  paragraphs: string[]
  emphasizedTerms?: string[]
}>(), {
  emphasizedTerms: () => []
})

const escapedTerms = computed(() => props.emphasizedTerms
  .filter(Boolean)
  .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

const emphasisPattern = computed(() => escapedTerms.value.length
  ? new RegExp(`(${escapedTerms.value.join('|')})`, 'g')
  : null)

const paragraphParts = (paragraph: string) => {
  if (!emphasisPattern.value) return [{ text: paragraph, emphasized: false }]

  return paragraph
    .split(emphasisPattern.value)
    .filter(Boolean)
    .map(text => ({
      text,
      emphasized: props.emphasizedTerms.includes(text)
    }))
}
</script>

<template>
  <section class="[ about-editorial-section ] grid grid-cols-[minmax(14rem,0.58fr)_minmax(0,1.42fr)] gap-[clamp(2.5rem,7vw,7rem)] py-[clamp(2.8rem,5vw,4.8rem)] tablet:grid-cols-[minmax(12rem,0.5fr)_minmax(0,1.5fr)] tablet:gap-8 compact:grid-cols-1 compact:gap-4 compact:py-8">
    <header class="[ about-editorial-heading ] self-start compact:max-w-96">
      <p class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">
        {{ eyebrow }}
      </p>
      <h2 class="m-0 pb-1 font-display text-h3 font-normal leading-[1.12] compact:pb-0.5 compact:text-2xl compact:leading-tight">
        {{ title }} <span class="text-archive-red">{{ accent }}</span>
      </h2>
    </header>

    <div class="[ about-editorial-copy ] max-w-180">
      <p
        v-for="paragraph in paragraphs"
        :key="paragraph"
        class="mt-0 mb-6 font-display text-lg leading-relaxed text-archive-body last:mb-0 compact:mb-5 compact:text-base"
      >
        <template v-for="(part, partIndex) in paragraphParts(paragraph)" :key="`${part.text}-${partIndex}`">
          <strong v-if="part.emphasized" class="font-semibold text-archive-ink">{{ part.text }}</strong>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </div>
  </section>
</template>
