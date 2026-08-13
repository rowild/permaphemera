<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

interface EditorialSection {
  id: string
  eyebrow: string
  title: string
  accent: string
  paragraphs: string[]
  items?: string[]
}

const emailHref = 'mailto:office@rowild.at'
const phoneHref = 'tel:+436766089613'

const contactRecordItems = computed(() => [
  { label: t('contactPage.record.project'), value: 'PERMAPHEMERA' },
  { label: t('contactPage.record.responsible'), value: 'Robert Wildling' },
  { label: t('contactPage.record.address'), value: t('contactPage.record.addressValue') },
  { label: t('contactPage.record.email'), value: 'office@rowild.at', href: emailHref },
  { label: t('contactPage.record.phone'), value: '+43 676 6089613', href: phoneHref }
])

const editorialSections = computed<EditorialSection[]>(() => [
  {
    id: 'reasons-to-write',
    eyebrow: t('contactPage.sections.reasons.eyebrow'),
    title: t('contactPage.sections.reasons.title'),
    accent: t('contactPage.sections.reasons.accent'),
    paragraphs: [t('contactPage.sections.reasons.p1')],
    items: [
      t('contactPage.sections.reasons.item1'),
      t('contactPage.sections.reasons.item2'),
      t('contactPage.sections.reasons.item3'),
      t('contactPage.sections.reasons.item4')
    ]
  },
  {
    id: 'first-message',
    eyebrow: t('contactPage.sections.message.eyebrow'),
    title: t('contactPage.sections.message.title'),
    accent: t('contactPage.sections.message.accent'),
    paragraphs: [
      t('contactPage.sections.message.p1'),
      t('contactPage.sections.message.p2')
    ]
  },
  {
    id: 'selection-and-reply',
    eyebrow: t('contactPage.sections.selection.eyebrow'),
    title: t('contactPage.sections.selection.title'),
    accent: t('contactPage.sections.selection.accent'),
    paragraphs: [
      t('contactPage.sections.selection.p1'),
      t('contactPage.sections.selection.p2')
    ]
  }
])

useSeoMeta({
  title: () => t('contactPage.seoTitle'),
  description: () => t('contactPage.seoDescription')
})
</script>

<template>
  <main class="[ site-shell ] [ contact-page ] archive-drafting-canvas archive-routed-page-surface relative z-1 min-h-screen overflow-hidden">
    <ArchivePageChrome />
    <ArchiveHeader />

    <div id="main-content">
      <section class="[ contact-page-intro ] [ section-band ] relative mx-auto grid min-h-128 max-w-[105rem] grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] items-center gap-[clamp(3rem,7vw,7rem)] px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,6vw,6rem)] tablet:min-h-0 tablet:grid-cols-1 tablet:gap-8 compact:gap-6 compact:px-4 compact:py-6" aria-labelledby="contact-page-title">
        <header class="[ contact-page-heading ]">
          <ArchiveBreadcrumb>
            <ArchiveTextLink :to="localePath('/')">{{ $t('navigation.archive') }}</ArchiveTextLink><span aria-hidden="true">/</span><span>{{ $t('contactPage.breadcrumb') }}</span>
          </ArchiveBreadcrumb>
          <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs">
            {{ $t('contactPage.eyebrow') }}
          </p>
          <h1 id="contact-page-title" class="m-0 max-w-216 pb-2 font-display text-hero font-light leading-[0.98] tablet:text-h1-steep compact:pb-1 compact:text-5xl compact:leading-[1.04]">
            {{ $t('contactPage.title') }} <span class="text-archive-red">{{ $t('contactPage.accent') }}</span>
          </h1>
          <p class="mt-5 mb-0 max-w-152 text-lg leading-relaxed text-archive-body compact:mt-4 compact:text-base">
            {{ $t('contactPage.intro') }}
          </p>
        </header>

        <ArchiveContactRecord
          :label="$t('contactPage.record.label')"
          :record-aria="$t('contactPage.record.aria')"
          :items="contactRecordItems"
        />
      </section>

      <ArchiveInsetDivider />

      <article class="[ contact-editorial ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] compact:px-4" :aria-label="$t('contactPage.articleAria')">
        <ArchiveEditorialSection
          v-for="section in editorialSections"
          :key="section.id"
          v-bind="section"
        />
      </article>

      <section class="[ contact-actions ] [ section-band ] mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-10 px-[clamp(1.4rem,5vw,5.2rem)] py-[clamp(3rem,5vw,5rem)] compact:grid-cols-1 compact:gap-5 compact:px-4 compact:py-8" aria-labelledby="contact-actions-title">
        <div>
          <p class="m-0 mb-3 font-display text-eyebrow font-medium tracking-widest text-archive-red uppercase compact:mb-2 compact:text-xs">{{ $t('contactPage.actionsEyebrow') }}</p>
          <h2 id="contact-actions-title" class="m-0 max-w-192 pb-1 font-display text-h2 font-normal leading-[1.08] compact:pb-0.5 compact:text-3xl compact:leading-tight">
            {{ $t('contactPage.actionsTitle') }} <span class="text-archive-red">{{ $t('contactPage.actionsAccent') }}</span>
          </h2>
          <p class="mt-4 mb-0 max-w-152 font-display text-base leading-relaxed text-archive-muted">
            {{ $t('contactPage.privacyNote') }}
            <ArchiveTextLink :to="localePath('/privacy/')">{{ $t('contactPage.privacyAction') }}</ArchiveTextLink>
          </p>
        </div>
        <div class="[ contact-action-links ] flex flex-wrap justify-end gap-4 compact:justify-start compact:gap-3">
          <ArchiveActionHint id="contact-email-hint" :text="$t('contactPage.emailHint')">
            <template #default="{ describedBy }">
              <ArchiveButton :href="emailHref" :aria-describedby="describedBy" variant="primary">
                {{ $t('contactPage.emailAction') }} <ArchiveArrow />
              </ArchiveButton>
            </template>
          </ArchiveActionHint>
          <ArchiveActionHint id="contact-phone-hint" :text="$t('contactPage.phoneHint')">
            <template #default="{ describedBy }">
              <ArchiveButton :href="phoneHref" :aria-describedby="describedBy" variant="secondary">
                {{ $t('contactPage.phoneAction') }}
              </ArchiveButton>
            </template>
          </ArchiveActionHint>
        </div>
      </section>
    </div>

    <ArchiveFooter />
  </main>
</template>
