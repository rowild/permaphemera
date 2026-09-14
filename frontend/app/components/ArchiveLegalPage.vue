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

const localePath = useLocalePath()
</script>

<template>
  <main class="[ site-shell ] [ legal-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />

    <div id="main-content">
      <section class="[ legal-page-intro ] [ section-band ] relative mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:grid-cols-1 tablet:gap-8 compact:gap-6 compact:px-4 compact:py-6" :aria-labelledby="`${props.sections[0]?.id ?? 'legal'}-page-title`">
        <header class="[ legal-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ props.breadcrumb }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">
            {{ props.eyebrow }}
          </p>
          <h1 :id="`${props.sections[0]?.id ?? 'legal'}-page-title`" class="m-0 max-w-216 pb-2 font-display text-hero font-light leading-[0.98] tablet:text-h1-steep compact:pb-1 compact:text-5xl compact:leading-[1.04]">
            {{ props.title }} <span class="text-archive-red">{{ props.accent }}</span>
          </h1>
          <p class="mt-5 mb-0 max-w-152 text-lg leading-relaxed text-archive-body compact:mt-4 compact:text-base">
            {{ props.intro }}
          </p>
        </header>

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
      </section>

      <ArchiveInsetDivider />

      <section class="[ legal-page-body ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:px-4 compact:py-8">
        <article class="[ legal-page-article ] min-w-0" :aria-label="props.articleAria">
          <LegalEditorialSection
            v-for="section in props.sections"
            :key="section.id"
            :section="section"
          />
        </article>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
