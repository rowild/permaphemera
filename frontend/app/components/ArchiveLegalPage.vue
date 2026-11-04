<script setup lang="ts">
import type { LegalRecordItem, LegalSection } from '~/types/legal'

const props = defineProps<{
  breadcrumb: string
  eyebrow: string
  title: string
  accent: string
  intro: string
  recordLabel: string
  recordAria: string
  articleAria: string
  recordItems: LegalRecordItem[]
  sections: LegalSection[]
}>()

</script>

<template>
  <div class="[ legal-page ]">

      <ArchiveEditorialHero :title-id="`${props.sections[0]?.id ?? 'legal'}-page-title`" layout="aside">
          <ArchiveBreadcrumb :items="[{ label: props.breadcrumb }]" />
          <ArchiveEyebrow>
            {{ props.eyebrow }}
          </ArchiveEyebrow>
          <ArchivePageTitle :title-id="`${props.sections[0]?.id ?? 'legal'}-page-title`" :title="props.title" :accent="props.accent" :intro="props.intro" />

          <template #aside>
        <ArchiveFactRecord class="[ legal-record ]" :label="props.recordLabel" :record-aria="props.recordAria" :items="props.recordItems" />

          </template>

      </ArchiveEditorialHero>

      <ArchiveInsetDivider />

      <section class="[ legal-page-body ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5">
        <article class="[ legal-page-article ] min-w-0" :aria-label="props.articleAria">
          <ArchiveEditorialSection v-for="section in props.sections" :key="section.id" v-bind="section" />
        </article>
      </section>
  </div>
</template>
