<script setup lang="ts">
import { newsMarkdownToHtml } from '~/utils/newsMarkdown'
import { formatNewsDate } from '~/utils/resolveNews'

const { news } = useArchiveData()
const { locale } = useI18n()
const localePath = useLocalePath()

const { slug, record: article } = useRecordBySlug(news, 'newsPage.notFound')
const index = computed(() => news.value.indexOf(article.value))
// The list is newest first: the newer article comes before this one.
const newer = computed(() => (index.value > 0 ? news.value[index.value - 1] : undefined))
const older = computed(() => news.value[index.value + 1])
const bodyHtml = computed(() => newsMarkdownToHtml(article.value?.description, (path) => localePath(path)))
const hasRecords = computed(() => Boolean(article.value && (article.value.exhibitions.length || article.value.venues.length || article.value.persons.length || article.value.organisations.length || article.value.sponsors.length)))

usePageSeo(`/news/${slug}/`)
</script>

<template>
  <div v-if="article" class="[ news-article-page ]">

    <article aria-labelledby="news-article-title">
      <header class="[ news-article-intro ] [ section-band ] relative mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pt-[clamp(3rem,6vw,6rem)] pb-[clamp(1.5rem,3vw,3rem)] compact:px-4 compact:pt-6 compact:pb-4">
        <ArchiveBreadcrumb :items="[{ label: $t('newsPage.breadcrumb'), to: '/news/' }, { label: article.title }]" />
        <p class="[ eyebrow ] archive-routed-eyebrow m-0 mb-[0.85rem] inline-flex items-center gap-[0.7rem] font-display text-eyebrow font-medium tracking-[0.06em] text-archive-red uppercase compact:mb-2 compact:text-xs"><time :datetime="article.date">{{ formatNewsDate(article.date, locale) }}</time> · {{ $t(`newsPage.topics.${article.topic}`) }}</p>
        <h1 id="news-article-title" class="m-0 max-w-232 font-display text-h1-steep font-light leading-[0.98] compact:text-4xl compact:leading-[1.05]">{{ article.title }}</h1>
        <p v-if="article.summary" class="mt-[1.4rem] mb-0 max-w-180 text-lg leading-[1.55] text-archive-body tablet:text-base tablet:leading-[1.45] compact:mt-4 compact:leading-normal">{{ article.summary }}</p>
      </header>

      <div
        v-if="bodyHtml || article.image"
        class="[ news-article-body ] [ section-band ] mx-auto grid max-w-[105rem] items-start gap-[clamp(2rem,5vw,5rem)] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(2.5rem,4vw,4rem)] tablet:grid-cols-1 compact:px-4"
        :class="bodyHtml && article.image ? 'grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]' : 'grid-cols-1'"
      >
        <ArchiveRichText v-if="bodyHtml" class="max-w-3xl" :html="bodyHtml" links />
        <ArchiveImage v-if="article.image" class="block aspect-4/3 w-full max-w-176 border border-archive-rule-warm/30 object-cover" :src="article.image" :alt="article.image_alt" sizes="(max-width: 767px) 92vw, 44rem" eager />
      </div>

      <section v-if="hasRecords" class="[ news-article-records ] [ section-band ] mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(2rem,4vw,3rem)] compact:px-4" aria-labelledby="news-article-records-title">
        <ArchiveInsetDivider class="mb-8" />
        <h2 id="news-article-records-title" class="m-0 mb-6 font-display text-h2 font-normal leading-[0.98] compact:text-3xl">{{ $t('newsPage.inArticle') }}</h2>

        <template v-if="article.exhibitions.length">
          <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">{{ $t('newsPage.groups.exhibitions') }}</h3>
          <div class="mb-10 grid grid-cols-2 gap-4 tablet:grid-cols-1">
            <ExhibitionCard v-for="exhibition in article.exhibitions" :key="exhibition.id" :exhibition="exhibition" layout="side" />
          </div>
        </template>

        <template v-if="article.venues.length">
          <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">{{ $t('newsPage.groups.venues') }}</h3>
          <div class="mb-10 grid grid-cols-4 gap-[1.4rem] tablet:grid-cols-2 compact:gap-3">
            <VenueArchiveCard v-for="venue in article.venues" :key="venue.id" :venue="venue" />
          </div>
        </template>

        <div v-if="article.persons.length || article.organisations.length || article.sponsors.length" class="grid grid-cols-3 gap-[clamp(2rem,4vw,4rem)] tablet:grid-cols-1">
          <section v-if="article.persons.length">
            <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">{{ $t('newsPage.groups.persons') }}</h3>
            <PersonDirectoryEntry v-for="person in article.persons" :key="person.id" :person="person" :roles="person.roles.map((role) => role.slug)" />
          </section>
          <section v-if="article.organisations.length">
            <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">{{ $t('newsPage.groups.organisations') }}</h3>
            <OrganisationDirectoryEntry v-for="organisation in article.organisations" :key="organisation.id" :organisation="organisation" />
          </section>
          <section v-if="article.sponsors.length">
            <h3 class="m-0 mb-4 pl-1 text-eyebrow font-medium tracking-widest text-archive-red uppercase">{{ $t('newsPage.groups.sponsors') }}</h3>
            <SponsorDirectoryEntry v-for="sponsor in article.sponsors" :key="sponsor.id" :sponsor="sponsor" />
          </section>
        </div>
      </section>

      <nav class="[ news-article-pager ] [ section-band ] mx-auto grid max-w-[105rem] grid-cols-2 gap-6 px-[clamp(1.4rem,5vw,5.2rem)] pb-[clamp(3rem,5vw,5rem)] compact:grid-cols-1 compact:gap-4 compact:px-4" :aria-label="$t('newsPage.pagerAria')">
        <NuxtLink v-if="newer" class="group text-archive-ink no-underline" :to="localePath(`/news/${newer.slug}/`)">
          <span class="m-0 mb-1 block text-xs tracking-widest text-archive-muted uppercase">{{ $t('newsPage.newer') }}</span>
          <span class="block font-display text-xl leading-[1.18] group-hover:text-archive-red group-focus-visible:text-archive-red">{{ newer.title }}</span>
        </NuxtLink>
        <span v-else />
        <NuxtLink v-if="older" class="group text-right text-archive-ink no-underline compact:text-left" :to="localePath(`/news/${older.slug}/`)">
          <span class="m-0 mb-1 block text-xs tracking-widest text-archive-muted uppercase">{{ $t('newsPage.older') }}</span>
          <span class="block font-display text-xl leading-[1.18] group-hover:text-archive-red group-focus-visible:text-archive-red">{{ older.title }}</span>
        </NuxtLink>
        <ArchiveTextLink class="col-span-full mt-2" :to="localePath('/news/')">
          {{ $t('newsPage.allNews') }}
          <ArchiveArrow />
        </ArchiveTextLink>
      </nav>
    </article>
  </div>
</template>
