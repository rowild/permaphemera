<script setup lang="ts">
import type { EditorialSection } from '~/types/editorial'
const props = withDefaults(defineProps<EditorialSection>(), {
  eyebrow: undefined,
  accent: undefined,
  paragraphs: () => [],
  items: () => [],
  emphasizedTerms: () => [],
  details: () => [],
  links: () => []
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
  <section :id="props.id" class="[ archive-editorial-section ] grid scroll-mt-32 grid-cols-[minmax(14rem,0.58fr)_minmax(0,1.42fr)] gap-[clamp(2.5rem,7vw,7rem)] py-[clamp(2.8rem,5vw,4.8rem)] tablet:grid-cols-[minmax(12rem,0.5fr)_minmax(0,1.5fr)] tablet:gap-8 compact:scroll-mt-20 compact:grid-cols-1 compact:gap-4 compact:py-5" :aria-labelledby="`${props.id}-title`">
    <header class="[ archive-editorial-heading ] self-start compact:max-w-96">
      <p v-if="props.eyebrow" class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">
        {{ props.eyebrow }}
      </p>
      <ArchiveSectionHeading :id="`${props.id}-title`" size="sm">
        {{ props.title }} <span v-if="props.accent" class="text-archive-red">{{ props.accent }}</span>
      </ArchiveSectionHeading>
    </header>

    <div class="[ archive-editorial-copy ] max-w-180">
      <p
        v-for="paragraph in props.paragraphs"
        :key="paragraph"
        class="mt-0 mb-6 font-display text-lg leading-relaxed text-archive-body last:mb-0 compact:mb-5 compact:text-base"
      >
        <template v-for="(part, partIndex) in paragraphParts(paragraph)" :key="`${part.text}-${partIndex}`">
          <strong v-if="part.emphasized" class="font-medium text-archive-ink">{{ part.text }}</strong>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>

      <ul v-if="props.items.length" class="mt-6 grid gap-3 pl-5 font-display text-lg leading-relaxed text-archive-body marker:text-archive-red compact:mt-5 compact:gap-2 compact:text-base">
        <li v-for="item in props.items" :key="item">
          {{ item }}
        </li>
      </ul>

      <dl v-if="props.details.length" class="[ editorial-detail-list ] mt-6 grid gap-2 compact:mt-5">
        <div v-for="detail in props.details" :key="`${detail.label}-${detail.value}`" class="grid grid-cols-[minmax(10rem,0.48fr)_minmax(0,1.52fr)] items-baseline gap-5 compact:grid-cols-1 compact:items-stretch compact:gap-1">
          <dt class="font-display text-xs font-medium tracking-widest text-archive-red uppercase">{{ detail.label }}</dt>
          <dd class="m-0 font-display text-base leading-snug text-archive-copy">
            <ArchiveTextLink v-if="detail.href" :href="detail.href">{{ detail.value }}</ArchiveTextLink>
            <template v-else>{{ detail.value }}</template>
          </dd>
        </div>
      </dl>

      <div v-if="props.links.length" class="[ editorial-source-links ] mt-6 flex flex-wrap gap-x-6 gap-y-3 compact:mt-5">
        <ArchiveTextLink v-for="link in props.links" :key="link.href" :href="link.href" target="_blank" rel="noopener noreferrer" icon-motion="external">
          {{ link.label }} <span aria-hidden="true">↗</span>
        </ArchiveTextLink>
      </div>
    </div>
  </section>
</template>
