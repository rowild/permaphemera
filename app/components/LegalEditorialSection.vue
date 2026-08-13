<script setup lang="ts">
import type { LegalSection } from '~/types/legal'

defineProps<{
  section: LegalSection
}>()
</script>

<template>
  <section :id="section.id" class="[ legal-editorial-section ] grid scroll-mt-32 grid-cols-[minmax(14rem,0.58fr)_minmax(0,1.42fr)] gap-[clamp(2.5rem,7vw,7rem)] py-[clamp(2.8rem,5vw,4.8rem)] tablet:grid-cols-[minmax(12rem,0.5fr)_minmax(0,1.5fr)] tablet:gap-8 compact:scroll-mt-20 compact:grid-cols-1 compact:gap-4 compact:py-8" :aria-labelledby="`${section.id}-title`">
    <header class="[ legal-editorial-heading ] self-start tablet:max-w-180">
      <p v-if="section.eyebrow" class="m-0 mb-3 font-display text-xs font-medium tracking-widest text-archive-red uppercase compact:mb-2">
        {{ section.eyebrow }}
      </p>
      <h2 :id="`${section.id}-title`" class="m-0 pb-1 font-display text-h3 font-normal leading-[1.12] compact:pb-0.5 compact:text-2xl compact:leading-tight">
        {{ section.title }}
      </h2>
    </header>

    <div class="[ legal-editorial-copy ] min-w-0 max-w-180">
      <div v-if="section.paragraphs?.length" class="[ legal-section-copy ]">
        <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-0 mb-5 font-display text-lg leading-relaxed text-archive-body last:mb-0 compact:mb-4 compact:text-base">
          {{ paragraph }}
        </p>
      </div>

      <ul v-if="section.items?.length" class="mt-5 grid gap-3 pl-5 font-display text-lg leading-relaxed text-archive-body marker:text-archive-red compact:mt-4 compact:gap-2 compact:text-base">
        <li v-for="item in section.items" :key="item">
          {{ item }}
        </li>
      </ul>

      <dl v-if="section.details?.length" class="[ legal-detail-list ] mt-5 grid gap-2 compact:mt-4">
        <div v-for="detail in section.details" :key="`${detail.label}-${detail.value}`" class="[ legal-detail-row ] grid grid-cols-[minmax(10rem,0.48fr)_minmax(0,1.52fr)] items-baseline gap-5 compact:grid-cols-1 compact:items-stretch compact:gap-1">
          <dt class="font-display text-xs font-medium tracking-widest text-archive-red uppercase">
            {{ detail.label }}
          </dt>
          <dd class="m-0 font-display text-base leading-snug text-archive-copy">
            <ArchiveTextLink v-if="detail.href" :href="detail.href">{{ detail.value }}</ArchiveTextLink>
            <template v-else>{{ detail.value }}</template>
          </dd>
        </div>
      </dl>

      <div v-if="section.links?.length" class="[ legal-source-links ] mt-6 flex flex-wrap gap-x-6 gap-y-3 compact:mt-5">
        <ArchiveTextLink
          v-for="link in section.links"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          icon-motion="external"
        >
          {{ link.label }} <span aria-hidden="true">↗</span>
        </ArchiveTextLink>
      </div>
    </div>
  </section>
</template>
