import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const [
  searchForm,
  factLedger,
  artistPage,
  landingPage,
  locationPage,
  exhibitionPage,
  artistEntry,
  metadataRow,
  archiveButton,
  archiveHeader,
  archiveFooter,
  archiveFooterMenu,
  archiveFooterIdentity,
  heroKaleidoscope,
  archiveAlphabetRail,
  archiveExhibitionsDivider,
  venueArchiveCard,
  archivePaperStack,
  landingExhibitionCard,
  archiveMethodFact,
  archiveScrollCue,
  mainCss,
  exhibitionsData
] = await Promise.all([
  readProjectFile('app/components/ArchiveSearchForm.vue'),
  readProjectFile('app/components/ArchiveFactLedger.vue'),
  readProjectFile('app/pages/artists/index.vue'),
  readProjectFile('app/pages/index.vue'),
  readProjectFile('app/pages/venues/[slug].vue'),
  readProjectFile('app/pages/exhibitions/[slug].vue'),
  readProjectFile('app/components/ArtistDirectoryEntry.vue'),
  readProjectFile('app/components/ArchiveMetadataRow.vue'),
  readProjectFile('app/components/ArchiveButton.vue'),
  readProjectFile('app/components/ArchiveHeader.vue'),
  readProjectFile('app/components/ArchiveFooter.vue'),
  readProjectFile('app/components/ArchiveFooterMenu.vue'),
  readProjectFile('app/components/ArchiveFooterIdentity.vue'),
  readProjectFile('app/components/HeroKaleidoscope.vue'),
  readProjectFile('app/components/ArchiveAlphabetRail.vue'),
  readProjectFile('app/components/ArchiveExhibitionsDivider.vue'),
  readProjectFile('app/components/VenueArchiveCard.vue'),
  readProjectFile('app/components/ArchivePaperStack.vue'),
  readProjectFile('app/components/LandingExhibitionCard.vue'),
  readProjectFile('app/components/ArchiveMethodFact.vue'),
  readProjectFile('app/components/ArchiveScrollCue.vue'),
  readProjectFile('app/assets/css/main.css'),
  readProjectFile('app/data/exhibitions.json')
])

const routedPages = [artistPage, landingPage, locationPage, exhibitionPage].join('\n')
const exhibitionRecords = JSON.parse(exhibitionsData)

// `exhibitions.json` is now the full 13-record canonical collection, not the
// old hand-curated 5-record landing selection — so a raw `.length === 5`
// check no longer means anything. The landing page instead *computes* its
// five-item selection at runtime (`selectedExhibitions` in app/pages/index.vue):
// visible records sorted featured-first then by start_date, first five taken.
// Mirror that composition here (same visibility rule as contentStatus.ts's
// VISIBLE_STATUSES, same sort, same slice) so the check still proves what it
// always proved — one featured card plus four secondary cards reach the
// landing page — against data the collection can keep growing into.
const VISIBLE_STATUSES = ['published', 'draft']
const landingSelectedExhibitions = exhibitionRecords
  .filter(({ status }) => VISIBLE_STATUSES.includes(status))
  .sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1
    return left.start_date.localeCompare(right.start_date)
  })
  .slice(0, 5)
const primaryLinkDefinition = archiveHeader.match(/const primaryLinks = computed\(\(\) => \[[\s\S]*?\] as const\)/)?.[0] ?? ''
const headerMenuSurfaceRule = mainCss.match(/\.archive-header-menu-surface \{([\s\S]*?)\n\}/)?.[1] ?? ''
const headerMenuBeforeRule = [...mainCss.matchAll(/\.archive-header-menu-surface::before \{([\s\S]*?)\n\}/g)].at(-1)?.[1] ?? ''
const headerMenuAfterRule = [...mainCss.matchAll(/\.archive-header-menu-surface::after \{([\s\S]*?)\n\}/g)].at(-1)?.[1] ?? ''
const responsiveVariantOrder = ['tablet', 'medium', 'compact', 'narrow']
  .map((variant) => mainCss.indexOf(`@custom-variant ${variant}`))
const tabletVariantPosition = mainCss.indexOf('@custom-variant tablet ')
const tabletLandscapeVariantPosition = mainCss.indexOf('@custom-variant tablet-landscape ')
const tabletPortraitVariantPosition = mainCss.indexOf('@custom-variant tablet-portrait ')
const checks = [
  ['max-width responsive variants cascade from broad to narrow', responsiveVariantOrder.every((position, index) => position >= 0 && (index === 0 || position > responsiveVariantOrder[index - 1]))],
  ['tablet orientation variants follow the general tablet baseline', tabletVariantPosition >= 0 && tabletLandscapeVariantPosition > tabletVariantPosition && tabletPortraitVariantPosition > tabletLandscapeVariantPosition && responsiveVariantOrder[1] > tabletPortraitVariantPosition],
  ['tablet and mobile header behavior starts at 1280px', mainCss.includes('@custom-variant tablet (@media (max-width: 1280px));') && mainCss.includes('@media (max-width: 1280px)')],
  ['mobile search remains a single row', searchForm.includes('compact:flex-nowrap') && !searchForm.includes('compact:flex-wrap')],
  ['mobile search action is a compact icon button', searchForm.includes('compact:size-12') && /<Search class="hidden[^\"]*compact:block/.test(searchForm)],
  ['mobile search hides long button copy and arrow', searchForm.includes('compact:sr-only') && /<ArchiveArrow[^>]*compact:hidden/.test(searchForm)],
  ['secondary three-fact ledgers stay in one multiline row below desktop', factLedger.includes("'grid-cols-3'") && factLedger.includes("'tablet:text-balance tablet:whitespace-normal'") && !factLedger.includes('tablet:truncate') && factLedger.includes('compact:px-1') && factLedger.includes('compact:py-2')],
  ['artist ledger stays stacked through tablet and becomes a row only on mobile', factLedger.includes("desktopLayout?: 'row' | 'stacked'") && factLedger.includes("'grid-cols-1 compact:grid-cols-3'") && factLedger.includes('compact:border-t-0 compact:border-l') && artistPage.includes('desktop-layout="stacked"')],
  ['artist introduction retains its text and sidebar composition through tablet', /\[ artists-page-intro \][^\"]*tablet:grid-cols-\[minmax\(0,1fr\)_16rem\][^\"]*compact:grid-cols-1/.test(artistPage) && /id="artists-page-title" class="[^"]*tablet:text-h1-steep/.test(artistPage) && /class="[^"]*tablet:text-base[^"]*">\{\{ \$t\('artists\.intro'\)/.test(artistPage)],
  ['artist and location introductions share the compact ledger', artistPage.includes('<ArchiveFactLedger') && locationPage.includes('<ArchiveFactLedger')],
  ['artist intro divider is hidden only on compact screens', /<ArchiveFactLedger[^>]*desktop-layout="stacked"[\s\S]*?<ArchiveInsetDivider class="compact:hidden"/.test(artistPage)],
  ['artist lists remain two columns on compact screens', artistPage.includes('compact:columns-2') && landingPage.includes('compact:columns-2')],
  ['artist rows use compact type and height', artistEntry.includes('compact:min-h-8') && (artistEntry.match(/compact:text-base/g) ?? []).length >= 2],
  ['metadata labels and values remain horizontal on mobile', metadataRow.includes('compact:grid-cols-[6.5rem_minmax(0,1fr)]')],
  ['exhibition metadata rows share one text-owned baseline and line-height', /exhibition: '[^']*items-baseline/.test(metadataRow) && /exhibition: '[^']*grid-cols-\[1\.125rem_minmax\(0,1fr\)\][^']*items-baseline[^']*leading-5/.test(metadataRow) && /exhibition: '[^']*leading-5[^']*text-archive-copy/.test(metadataRow) && metadataRow.includes('[ metadata-label ]') && metadataRow.includes('[ metadata-icon ]')],
  ['exhibition metadata follows location, dates, opening-hours order', /\$t\('exhibition\.location'\)[\s\S]*\$t\('exhibition\.dates'\)[\s\S]*\$t\('exhibition\.openingHours'\)/.test(exhibitionPage)],
  ['exhibition detail split sections share the hero 60/40 column ratio', /\[ exhibition-detail-hero \][^\"]*grid-cols-\[minmax\(30rem,1\.2fr\)_minmax\(23rem,0\.8fr\)\]/.test(exhibitionPage) && /\[ exhibition-detail-body \][^\"]*grid-cols-\[minmax\(30rem,1\.2fr\)_minmax\(23rem,0\.8fr\)\][^\"]*gap-\[clamp\(3rem,7vw,7rem\)\]/.test(exhibitionPage) && /\[ exhibition-experience \][^\"]*grid-cols-\[minmax\(0,1\.2fr\)_minmax\(24rem,0\.8fr\)\]/.test(exhibitionPage)],
  ['exhibition detail split sections collapse together at the tablet breakpoint', [/\[ exhibition-detail-hero \][^\"]*tablet:grid-cols-1/, /\[ exhibition-detail-body \][^\"]*tablet:grid-cols-1/, /\[ exhibition-experience \][^\"]*tablet:grid-cols-1/].every((pattern) => pattern.test(exhibitionPage))],
  ['exhibition secondary ledger uses a compact two-column grid', exhibitionPage.includes('compact:grid-cols-2 compact:gap-x-4')],
  ['shared mobile buttons remain compact, touchable, and center-grouped', archiveButton.includes('compact:min-h-12') && archiveButton.includes('compact:text-sm') && archiveButton.includes('compact:justify-center') && !archiveButton.includes('compact:justify-between')],
  ['the mobile header uses compact top-packed chrome', archiveHeader.includes('compact:min-h-16') && archiveHeader.includes('compact:content-start') && archiveHeader.includes('compact:pt-2') && archiveHeader.includes('compact:pb-0') && archiveHeader.includes('compact:px-4')],
  ['compact header carries the exhibition tagline tightly aligned with the wordmark', archiveHeader.includes('[ header-eyebrow ]') && archiveHeader.includes("$t('site.headerTagline')") && archiveHeader.includes('compact:pl-8') && archiveHeader.includes('compact:translate-y-2') && archiveHeader.includes('compact:gap-y-0')],
  ['the always-available header menu owns the single language switch', (archiveHeader.match(/<ArchiveLanguageSwitch/g) ?? []).length === 1 && archiveHeader.includes('[ mobile-nav-language ]') && /\[ mobile-menu \][^\"]*inline-flex/.test(archiveHeader) && !/\[ mobile-menu \][^\"]*hidden/.test(archiveHeader)],
  ['desktop brand, temple mark, and primary menu share one baseline with compact separators', /\[ site-header \][^\"]*items-baseline/.test(archiveHeader) && /\[ brand \][^\"]*items-baseline/.test(archiveHeader) && /\[ brand-mark \][^\"]*self-baseline/.test(archiveHeader) && /\[ desktop-nav \][^\"]*self-baseline/.test(archiveHeader) && archiveHeader.includes('[ desktop-nav-divider ]') && archiveHeader.includes('/svg/frames/sponsor-strip-frame.svg')],
  ['tablet hamburger aligns its right edge with the shared header gutter', /\[ header-actions \][^\"]*justify-self-end/.test(archiveHeader) && /\[ mobile-menu \][^\"]*w-11[^\"]*justify-end/.test(archiveHeader)],
  ['desktop popup hides visible primary links while retaining footer-only actions', /\[ mobile-nav-primary \][^\"]*hidden tablet:grid/.test(archiveHeader) && !primaryLinkDefinition.includes('navigation.about') && ['navigation.about', 'navigation.howItWorks', 'navigation.contact', 'footer.imprint', 'footer.privacy', 'footer.terms', 'footer.accessibility', 'footer.cookies'].every((key) => archiveHeader.includes(key))],
  ['header popup is absolutely anchored below the header instead of enlarging its grid', headerMenuSurfaceRule.includes('position: absolute;') && /\[ mobile-nav \][^\"]*top-\[calc\(100%-0\.2rem\)\]/.test(archiveHeader)],
  ['header menu paint order stays parchment then ornaments then links', headerMenuSurfaceRule.includes('background:') && /\.archive-header-menu-surface::before,[\s\S]*?z-index: 0;/.test(mainCss) && /\.archive-header-menu-surface > \* \{[\s\S]*?z-index: 1;/.test(mainCss) && !/\[ mobile-nav-(?:primary|secondary|language) \][^\"]*bg-/.test(archiveHeader)],
  ['header menu ornaments form one left-center drafting cluster', headerMenuBeforeRule.includes('top: 50%;') && headerMenuBeforeRule.includes('left: -1.5rem;') && headerMenuBeforeRule.includes('transform: translateY(-50%);') && headerMenuAfterRule.includes('top: 50%;') && headerMenuAfterRule.includes('left: 5.5rem;') && headerMenuAfterRule.includes('transform: translateY(-50%);')],
  ['header popup uses undistorted archival measurement ornaments', archiveHeader.includes('archive-header-menu-surface') && mainCss.includes('measurement-top-right.png') && mainCss.includes('aspect-ratio: 452 / 290') && mainCss.includes('quarter-circle-measurement.png') && mainCss.includes('aspect-ratio: 242 / 295') && mainCss.includes('background: url("/images/landing/footer/_recreated_anew/measurement-top-right.png") right top / 100% auto no-repeat')],
  ['desktop decorative menu star is removed', !archiveHeader.includes('[ desktop-compass ]')],
  ['footer navigation becomes a lower-z tablet and mobile bottom drawer', archiveFooter.includes('footerMenuOpen') && archiveFooter.includes('<Teleport to="body">') && /\[ mobile-footer-drawer \][^\"]*tablet:grid/.test(archiveFooter) && archiveFooter.includes('z-20') && archiveHeader.includes('z-30')],
  ['static footer navigation is hidden behind a tablet drawer trigger', archiveFooterMenu.includes('tablet:hidden') && /\[ mobile-footer-menu-trigger \][^\"]*tablet:flex/.test(archiveFooter)],
  ['tablet footer trigger contributes only one divider rule', /\[ mobile-footer-menu-trigger \][^\"]*border-b/.test(archiveFooter) && !/\[ mobile-footer-menu-trigger \][^\"]*border-y/.test(archiveFooter)],
  ['footer drawer preserves the complete menu and language control', (archiveFooter.match(/<ArchiveFooterMenu/g) ?? []).length === 2 && archiveFooterMenu.includes('<ArchiveLanguageSwitch inverted')],
  ['tablet footer identity remains visible outside the drawer', archiveFooter.includes('<ArchiveFooterIdentity :show-language="false"') && /\[ mobile-footer-identity \][^\"]*tablet:block/.test(archiveFooter) && archiveFooterMenu.includes("v-if=\"props.variant === 'desktop'\"")],
  ['footer language controls are right aligned', archiveFooterMenu.includes('[ footer-menu-language ]') && archiveFooterMenu.includes('justify-end') && archiveFooterIdentity.includes('[ footer-language ] flex justify-end')],
  ['supporter marquee activates only when its measured natural sequence overflows', archiveFooter.includes('const sponsorShouldMarquee = ref(false)') && archiveFooter.includes('new ResizeObserver(updateSponsorMarquee)') && archiveFooter.includes('naturalSequenceWidth > strip.clientWidth + 1') && archiveFooter.includes('v-if="sponsorShouldMarquee"') && archiveFooter.includes("sponsorShouldMarquee ? 'is-marquee w-max' : 'w-full justify-center'") && archiveFooter.includes(':tabindex="sponsorShouldMarquee ? 0 : -1"')],
  ['overflowing supporter strip uses two equal sequences for a seamless right-to-left loop', (archiveFooter.match(/\[ sponsor-sequence \] archive-sponsor-sequence/g) ?? []).length === 2 && archiveFooter.includes('archive-sponsor-marquee-track') && archiveFooter.includes('aria-hidden="true"') && mainCss.includes('.archive-sponsor-marquee-track.is-marquee') && mainCss.includes('animation: archive-sponsor-marquee 72s linear infinite;') && mainCss.includes('transform: translate3d(-50%, 0, 0);')],
  ['supporter marquee pauses for interaction and becomes scrollable with reduced motion', mainCss.includes('.archive-sponsor-strip:hover .archive-sponsor-marquee-track.is-marquee') && mainCss.includes('.archive-sponsor-strip:focus-visible .archive-sponsor-marquee-track.is-marquee') && /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.archive-sponsor-strip \{[\s\S]*?overflow-x: auto;[\s\S]*?\.archive-sponsor-marquee-track\.is-marquee \{[\s\S]*?animation: none;/.test(mainCss)],
  ['copyright is an ornament-free equal two-column row', /\[ footer-bottom \][^\"]*grid-cols-2/.test(archiveFooter) && !archiveFooter.includes('footer-bottom-center') && !archiveFooter.includes('footer-bottom-end')],
  ['footer drawer has modal keyboard and scroll management', archiveFooter.includes('trapFooterMenuFocus') && archiveFooter.includes("document.body.style.overflow = 'hidden'") && archiveFooter.includes('aria-modal="true"') && archiveFooter.includes('@keydown.esc="closeFooterMenu"')],
  ['footer drawer closes if the viewport leaves tablet mode', archiveFooter.includes("window.matchMedia('(max-width: 1280px)')") && archiveFooter.includes('handleDrawerViewportChange')],
  ['landing hero uses a smaller centered compact title', landingPage.includes('compact:text-center compact:text-3xl compact:leading-none')],
  ['landing hero title becomes exactly two lines in portrait tablet and compact layouts', /<span class="hidden tablet-portrait:block compact:block">[\s\S]*?landing\.hero\.line1[\s\S]*?landing\.hero\.line2/.test(landingPage)],
  ['landing hero fills the compact viewport and shifts space to its bottom', landingPage.includes('compact:min-h-[calc(100svh-4rem)]') && !/\[ hero-section \][^\"]*compact:min-h-auto/.test(landingPage) && landingPage.includes('compact:pt-1') && landingPage.includes('compact:pb-20')],
  ['tablet hero is orientation-aware and fills the remaining viewport', /\[ hero-section \][^\"]*tablet:min-h-\[calc\(100svh-6rem\)\][^\"]*tablet-landscape:grid-cols-/.test(landingPage) && landingPage.includes('tablet-landscape:row-start-1') && landingPage.includes('tablet-portrait:text-center')],
  ['landing scroll cue keeps a deliberate tablet and compact bottom inset', archiveScrollCue.includes('tablet:bottom-6') && !archiveScrollCue.includes('compact:bottom-[0.65rem]')],
  ['landing scroll cue is not gated by the kaleidoscope animation', landingPage.includes('<ArchiveScrollCue') && !landingPage.includes(':enabled="heroScrollCueVisible"') && !landingPage.includes('const heroScrollCueVisible')],
  ['landing hero lede is centered with a balanced compact measure', /<p class="[^"]*compact:mx-auto[^"]*compact:max-w-64[^"]*compact:text-center/.test(landingPage)],
  ['compact kaleidoscope uses the approved larger size while retaining side gutters', heroKaleidoscope.includes('compact:w-[min(86vw,20rem,44svh)]')],
  ['tablet kaleidoscope is constrained separately for landscape and portrait', heroKaleidoscope.includes('tablet-landscape:w-[min(42vw,31rem,66svh)]') && heroKaleidoscope.includes('tablet-portrait:w-[min(74vw,31rem,44svh)]')],
  ['landing hero actions share one centered intrinsic-width compact row', /\[ hero-copy \][\s\S]*?compact:flex-nowrap compact:justify-center/.test(landingPage) && (landingPage.match(/compact:w-fit compact:flex-none/g) ?? []).length >= 2 && landingPage.includes('landing.hero.exploreCompact') && landingPage.includes('landing.hero.details')],
  ['landing venue cards form a compact two-column grid', /\[ venue-grid \][^\"]*compact:grid-cols-2/.test(landingPage)],
  ['featured venue card rejoins the compact card grid', venueArchiveCard.includes('compact:col-span-1') && venueArchiveCard.includes('compact:row-auto') && (venueArchiveCard.match(/compact:h-32/g) ?? []).length >= 2],
  ['featured venue divider is hidden only on compact screens', /v-if="props\.featured"[^>]*class="[^\"]*\[ venue-card-divider \][^\"]*compact:hidden/.test(venueArchiveCard)],
  ['compact venue links clear the frame while staying close to their city', venueArchiveCard.includes('compact:pb-4') && venueArchiveCard.includes('compact:mb-1 compact:text-xs') && /\[ venue-card-link \][^\"]*compact:mb-1/.test(venueArchiveCard)],
  ['venue discovery uses one centered More paper stack with clip clearance', landingPage.includes(":label=\"$t('common.more')\"") && !landingPage.includes('[ section-cta ]') && !mainCss.includes('.archive-location-cta') && archivePaperStack.includes('compact:col-span-2') && archivePaperStack.includes('compact:justify-self-center') && archivePaperStack.includes('compact:mt-10') && archivePaperStack.includes('compact:w-24')],
  ['venue discovery action does not translate when pressed', !/venue: '[^']*active:translate-y/.test(archivePaperStack)],
  ['venue discovery action omits its arrow and uses reduced widths', archivePaperStack.includes('v-if="props.variant !== \'venue\'"') && /venue: '[^']*w-32 min-w-32[^']*compact:w-24 compact:min-w-24/.test(archivePaperStack)],
  ['locations and exhibitions reuse the same exhibition divider component', (landingPage.match(/<ArchiveExhibitionsDivider\s*\/>/g) ?? []).length === 2 && archiveExhibitionsDivider.includes('[ exhibitions-section-divider ]') && archiveExhibitionsDivider.includes('/svg/dividers/exhibitions-section-divider.svg')],
  ['the landing page still composes its selection with the mirrored featured-first sort and five-item slice', /\.sort\(\(left, right\) => \{[\s\S]*?left\.featured \? -1 : 1[\s\S]*?left\.start_date\.localeCompare\(right\.start_date\)[\s\S]*?\}\)\s*\.slice\(0, 5\)/.test(landingPage)],
  ['landing exhibition selection contains one featured record and four secondary records', landingSelectedExhibitions.length === 5 && landingSelectedExhibitions.filter(({ featured }) => featured).length === 1],
  ['selected exhibitions keep one full-width featured card and four secondary cards in tablet and compact two-column grids', /\[ exhibition-layout \][^\"]*tablet:grid-cols-1[^\"]*compact:grid-cols-2/.test(landingPage) && /\[ featured-exhibition \][^\"]*tablet:col-span-full/.test(landingPage) && /\[ record-list \][^\"]*grid-rows-4[^\"]*tablet:grid-cols-2[^\"]*tablet:grid-rows-2[^\"]*compact:contents/.test(landingPage)],
  ['selected exhibition cards use compact proportions and intrinsic centered action', landingExhibitionCard.includes('compact:min-h-80') && landingExhibitionCard.includes('compact:min-h-64') && /<ArchiveButton class="[^"]*w-fit[^"]*justify-self-center/.test(landingExhibitionCard)],
  ['featured exhibition action uses Enter Exhibition, shortens to Enter, and hides its arrow only on compact screens', landingExhibitionCard.includes("$t('cards.enterExhibition')") && landingExhibitionCard.includes("$t('cards.enter')") && /<ArchiveArrow[^>]*compact:hidden/.test(landingExhibitionCard)],
  ['featured exhibition action is compact and clears the lower frame', /<ArchiveButton class="[^"]*compact:min-h-10[^"]*compact:px-2/.test(landingExhibitionCard) && /\[ record-overlay \][^\"]*compact:pb-5/.test(landingExhibitionCard)],
  ['compact exhibition copy has frame-safe padding', /\[ record-overlay \][^\"]*compact:px-4/.test(landingExhibitionCard) && /\[ record-card-copy \][^\"]*compact:px-4/.test(landingExhibitionCard)],
  ['compact exhibition title is not prefixed by its artist and the action stays centered over the image', !landingExhibitionCard.includes('{{ props.exhibition.artist }}. {{ props.exhibition.title }}') && landingExhibitionCard.includes('[ record-card-action ]') && landingExhibitionCard.includes("$t('cards.openExhibition')") && landingExhibitionCard.includes('items-center justify-center') && landingExhibitionCard.includes('compact:pb-5')],
  ['both artist alphabets use one-line draggable rails', landingPage.includes('<ArchiveAlphabetRail') && artistPage.includes('<ArchiveAlphabetRail') && archiveAlphabetRail.includes('flex-nowrap') && archiveAlphabetRail.includes('overflow-x-auto') && archiveAlphabetRail.includes('@pointermove="handlePointerMove"') && archiveAlphabetRail.includes('scrollLeft = scrollStartX - distance') && !landingPage.includes('[ alphabet-filter ] my-8 flex flex-wrap') && !artistPage.includes('[ artist-alphabet-filter ] mt-8 mb-0 flex flex-wrap')],
  ['landing artist sidebar becomes the three-column fact ledger throughout tablet and mobile', /<ArchiveFactLedger[\s\S]*?class="hidden tablet:grid"/.test(landingPage) && /\[ archive-sidebar \][^\"]*tablet:border-t-0/.test(landingPage) && landingPage.includes("{ label: $t('landing.sidebar.preserved')") && landingPage.includes('<div class="tablet:hidden">')],
  ['sample record action leaves explicit tablet and compact space above its image', landingPage.includes("$t('landing.method.sample')") && landingPage.includes('tablet:mb-16') && landingPage.includes('compact:mx-auto') && landingPage.includes('compact:mb-10')],
  ['compact method steps use the requested positive translation', /\[ method-steps \][^\"]*compact:translate-y-1\.5/.test(landingPage)],
  ['compact method details breathe after the step table and quote', /\[ method-details \][^\"]*compact:mt-8/.test(landingPage) && /\[ method-quote \][^\"]*compact:mb-4/.test(landingPage)],
  ['compact method facts use shortened dividers', archiveMethodFact.includes('compact:after:hidden') && archiveMethodFact.includes('[ method-fact-divider-compact ]') && archiveMethodFact.includes('h-12 w-px')],
  ['compact method stamp occupies a centered row with bottom space', /\[ method-archive-stamp \][^\"]*compact:mx-auto[^\"]*compact:mb-8/.test(landingPage)],
  ['routed pages no longer use oversized compact section padding', !routedPages.includes('compact:py-12') && !routedPages.includes('compact:px-5')],
  ['search placeholders are deliberately short and localized', ['artists.searchPlaceholder', 'landing.locations.searchPlaceholder', 'landing.exhibitions.searchPlaceholder', 'landing.artists.searchPlaceholder', 'location.searchPlaceholder'].every((key) => routedPages.includes(key))]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Mobile density contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log('Mobile search, ledgers, artist columns, metadata, controls, and route spacing are compact.')
}
