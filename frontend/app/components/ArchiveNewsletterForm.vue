<script setup lang="ts">
import { SITE_OWNER } from '~/utils/siteOwner'
import { NEWSLETTER_TOPICS, buildSubscribeBody, groupTownsByState } from '~/utils/newsletter'
import type { NewsletterTopic } from '~/utils/newsletter'

// The newsletter sign-up on /newsletter/: address, first and last name, topics, towns, consent.
// The only form (the invite holds none since 2026-11-09, owner). Plan: plans/2026-11-07__newsletter.md §4.

const emit = defineEmits<{ subscribed: [] }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const stateName = useStateName()
const archive = useArchiveSnapshot()
const { status, error, submit } = useNewsletterSubscription()
const invite = useNewsletterInvite()

const uid = useId()
const ids = {
  email: `${uid}-email`,
  firstName: `${uid}-first-name`,
  lastName: `${uid}-last-name`,
  honeypot: `${uid}-website`,
  message: `${uid}-message`
}

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const topics = ref<NewsletterTopic[]>([...NEWSLETTER_TOPICS])
const towns = ref<string[]>([])
const consent = ref(false)
const website = ref('')
const localError = ref<'missing_topic' | null>(null)
let startedAt = 0
onMounted(() => { startedAt = Date.now() })

const townGroups = computed(() => groupTownsByState(archive.value.locations, stateName))

const hasTopic = (topic: NewsletterTopic) => topics.value.includes(topic)
const setTopic = (topic: NewsletterTopic, on: boolean) => {
  topics.value = NEWSLETTER_TOPICS.filter((key) => (key === topic ? on : topics.value.includes(key)))
  if (topics.value.length) localError.value = null
}

const sending = computed(() => status.value === 'sending')
const message = computed(() => {
  const code = localError.value ?? (status.value === 'error' ? error.value : null)
  if (!code) return ''
  return code === 'failed' ? t('newsletter.errors.failed', { email: SITE_OWNER.email }) : t(`newsletter.errors.${code}`)
})

const send = async () => {
  if (topics.value.length === 0) {
    localError.value = 'missing_topic'
    return
  }
  localError.value = null
  await submit(buildSubscribeBody(
    { email: email.value, firstName: firstName.value, lastName: lastName.value, towns: towns.value, topics: topics.value, consent: consent.value, website: website.value },
    {
      language: locale.value,
      source: 'page',
      pageUrl: import.meta.client ? `${window.location.origin}${route.path}` : '',
      startedAt
    }
  ))
  if (status.value === 'pending') {
    invite.markSubscribed()
    emit('subscribed')
  }
}
</script>

<template>
  <div class="[ newsletter-form ] min-w-0">
    <div v-if="status === 'pending'" class="grid gap-2" role="status">
      <p class="m-0 font-display text-title text-archive-ink">{{ $t('newsletter.success.title') }}</p>
      <p class="m-0 max-w-2xl text-base leading-relaxed text-archive-body compact:text-sm">{{ $t('newsletter.success.text', { email: email.trim() }) }}</p>
    </div>

    <form v-else class="grid gap-6 compact:gap-4" :aria-describedby="message ? ids.message : undefined" @submit.prevent="send">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 compact:grid-cols-1">
        <ArchiveTextField :id="ids.email" v-model="email" class="col-span-2 compact:col-span-1" type="email" autocomplete="email" required :label="$t('newsletter.form.email')" />
        <ArchiveTextField :id="ids.firstName" v-model="firstName" autocomplete="given-name" :label="$t('newsletter.form.firstName')" />
        <ArchiveTextField :id="ids.lastName" v-model="lastName" autocomplete="family-name" :label="$t('newsletter.form.lastName')" />
      </div>

      <fieldset class="m-0 border-0 p-0" data-part="topics">
        <legend class="mb-3 font-display text-sm tracking-widest text-archive-red uppercase compact:text-xs">{{ $t('newsletter.form.topicsLegend') }}</legend>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 compact:grid-cols-1 compact:gap-3">
          <ArchiveCheckbox
            v-for="topic in NEWSLETTER_TOPICS"
            :key="topic"
            :value="topic"
            :title="$t(`newsletter.topics.${topic}.title`)"
            :note="$t(`newsletter.topics.${topic}.note`)"
            :model-value="hasTopic(topic)"
            @update:model-value="setTopic(topic, $event)"
          />
        </div>
      </fieldset>

      <fieldset class="m-0 border-0 p-0">
        <legend class="mb-1 font-display text-sm tracking-widest text-archive-red uppercase compact:text-xs">{{ $t('newsletter.form.townsLegend') }}</legend>
        <p class="m-0 mb-2 text-xs leading-snug text-archive-muted">{{ $t('newsletter.form.townsNote') }}</p>
        <ArchiveTownSelect v-model="towns" :groups="townGroups" />
      </fieldset>

      <!-- Left empty by people; bots fill every field. -->
      <div class="sr-only" aria-hidden="true" data-part="honeypot">
        <label :for="ids.honeypot">{{ $t('newsletter.form.honeypot') }}</label>
        <input :id="ids.honeypot" v-model="website" type="text" name="website" tabindex="-1" autocomplete="off">
      </div>

      <div class="grid gap-1" data-part="consent">
        <ArchiveCheckbox v-model="consent" size="small" required>{{ $t('newsletter.form.consent') }}</ArchiveCheckbox>
        <p class="m-0 pl-8 text-xs text-archive-muted">
          {{ $t('newsletter.form.consentMore') }}
          <ArchiveTextLink :to="localePath('/privacy/')">{{ $t('newsletter.form.consentLink') }}</ArchiveTextLink>.
        </p>
      </div>

      <p v-if="message" :id="ids.message" class="m-0 text-sm text-archive-red" role="alert">{{ message }}</p>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-3 compact:grid compact:grid-cols-1">
        <ArchiveButton type="submit" :disabled="sending" class="compact:w-full">
          {{ sending ? $t('newsletter.form.sending') : $t('newsletter.form.submit') }} <ArchiveArrow v-if="!sending" />
        </ArchiveButton>
        <!-- The invite says the cadence in its own text already. -->
        <p class="m-0 text-sm text-archive-muted">{{ $t('newsletter.form.cadence') }}</p>
      </div>
    </form>
  </div>
</template>
