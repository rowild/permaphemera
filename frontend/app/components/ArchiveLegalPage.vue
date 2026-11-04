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
        <aside class="[ legal-record ] self-center border-y border-archive-rule-warm/28 py-5 tablet:max-w-180 compact:py-4" :aria-label="props.recordAria">
          <p class="m-0 mb-4 font-display text-xs font-medium tracking-widest text-archive-red uppercase compact:mb-3">
            {{ props.recordLabel }}
          </p>
          <dl class="m-0 grid gap-3">
            <div v-for="item in props.recordItems" :key="`${item.label}-${item.value}`" class="grid grid-cols-[minmax(7rem,0.42fr)_minmax(0,1fr)] items-baseline gap-4 compact:grid-cols-[6.5rem_minmax(0,1fr)] compact:gap-3">
              <dt class="font-display text-xs tracking-widest text-archive-muted uppercase">{{ item.label }}</dt>
              <dd class="m-0 font-display text-base leading-snug text-archive-copy">
                <ArchiveTextLink v-if="item.href" :href="item.href">{{ item.value }}</ArchiveTextLink>
                <template v-else>{{ item.value }}</template>
              </dd>
            </div>
          </dl>
        </aside>

          </template>

      </ArchiveEditorialHero>

      <ArchiveInsetDivider />

      <section class="[ legal-page-body ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-5">
        <article class="[ legal-page-article ] min-w-0" :aria-label="props.articleAria">
          <LegalEditorialSection
            v-for="section in props.sections"
            :key="section.id"
            :section="section"
          />
        </article>
      </section>
  </div>
</template>
