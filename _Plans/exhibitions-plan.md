# PERMAPHEMERA Technical Blueprint & Multi-Language Architecture Plan

This plan outlines the complete execution roadmap for the WebGL 360° Exhibition Archiving Platform. It covers data structures, memory management strategies, configuration setups, and a step-by-step process tracker.

---

## 0. Current Planning Inputs

The current working identity is **PERMAPHEMERA**: a curated archive of temporary exhibitions and spatial memories. The design direction is no longer abstract; the frontend implementation must be based on the mockups and source images in `_Plans/designs/landing-page/`.

### Available Landing Page Design Assets

* `_Plans/designs/landing-page/landing-page-01-hero-section.png`
  * Desktop hero: editorial archive layout, top navigation, language switcher, large serif headline, primary/secondary CTAs, and radial image-collage archive motif.
* `_Plans/designs/landing-page/landing-page-01-hero-section_mobile-version.png`
  * Mobile hero: compact top bar, language switcher, hamburger menu, radial collage first, three circular navigation controls, stacked headline, and full-width CTA buttons.
* `_Plans/designs/landing-page/landing-page-02-locations v2.png`
  * Locations section: "Galleries across Austria", large search bar, featured Parkschlössl card, smaller venue cards, and "Show more" pagination/action.
* `_Plans/designs/landing-page/landing-page-03-selected-exhibitions v2.png`
  * Selected exhibitions section: large featured 360° record card with carousel arrows and a right-hand list of exhibition records.
* `_Plans/designs/landing-page/landing-page-04-artists.png`
  * Artists section: searchable alphabetical artist index with side metadata for archive span and locations.
* `_Plans/designs/landing-page/landing-page-05-how-to-navigate.png`
  * Method/how-it-works section: archive method copy, layered paper/photo composition, panorama navigation markers, and three-step explanation (`Captured`, `Connected`, `Preserved`).
* `_Plans/designs/landing-page/landing-page-06-sponsors-and-footer.png`
  * Light sponsor/footer option: supporter strip, footer navigation groups, language switcher, legal links, and archival seal.
* `_Plans/designs/landing-page/landing-page-06-sponsors-and-footer-dark.png`
  * Dark sponsor/footer option: preferred high-contrast footer variant with horizontally scrollable sponsor strip.
* `_Plans/designs/landing-page/Parkschlössl.jpg`
  * Real venue image for the first pilot location card.

### Landing Page Structure

The first frontend milestone must implement the landing page in this order:

1. Hero
2. Locations / galleries
3. Selected exhibitions
4. Artists
5. How to navigate / archive method
6. Supporters and footer

The visual language is parchment-like, archival, and editorial rather than SaaS-like: warm off-white background, serif display typography, black text, muted rust/copper accent color, fine ornamental linework, compass/measurement motifs, paper/card edges, and restrained shadowing. The design mockups are the source of truth for spacing, composition, and section hierarchy.

---

## 1. Known Blind Spots, Deferrals & Excluded Configurations

The following infrastructure components are **omitted from the first implementation milestone** and must be resolved separately using existing system templates:

* **Hetzner Server Provisioning:** Docker Compose configurations, PostgreSQL database tuning parameters, and Reverse Proxy/SSL setups on Hetzner are not handled here.
* **Model Context Protocol (MCP) Server Configuration:** Custom automated environment parameters, data-ingestion scrapers, or internal tool mappings running on your local MCP instance are excluded.
* **Nuxt i18n Workspace Synchronization:** The concrete folder composition, standard middleware hooks, and locale cookie handling matching your existing multi-language reference app must be directly copied over during initial setup.
* **Directus Backend Setup:** Directus is part of the target architecture, but it is **not** part of the first frontend build. The first frontend must run from local JSON data only.
* **Directus-to-Cloudflare Hook Specifics:** The configuration details of your existing Cloudflare asset offloading extension are deferred until the Directus-backed phase.

---

## 2. Production Database Schema (Directus v11)

This section is the **single living schema**. It is built by `directus/scripts/schema.mjs` (the source of truth for Directus), mirrored 1:1 by the JSON files in `frontend/app/data/` and the types in `frontend/app/types/content.ts`. Naming and layout follow `_Plans/directus-schema-conventions.md` with prefix `pp_`. The design that produced it is `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md`.

Last reconciled: 2026-09-14. Schema version `2026-09-14.1` (see `pp_meta`).

### Status and system fields

**`status`** is three-valued on every entity: `published`, `draft`, `archived`. It is wired to Directus' native archive feature: `archive_field` `status`, `archive_value` `archived`, `unarchive_value` `draft`.

**System fields.** Every entity carries `id` (UUID) plus six system fields: `status`, `sort`, `user_created`, `date_created`, `user_updated`, `date_updated`. The last four are filled by Directus automatically. Structural tables (`mm__…`, `translations__…`) carry none of them — only `id`, the two foreign keys and `sort`.

### Collections

Root folder `pp_archive` (label "PERMAPHEMERA", icon `inventory_2`, colour `#a6523c`) holds the main collections. `pp_meta` is a hidden singleton. `languages` is Directus' own and stays unprefixed.

| Collection | Kind | Group | Hidden |
|---|---|---|---|
| `pp_exhibitions` | main | `pp_archive` | no |
| `pp_venues` | main | `pp_archive` | no |
| `pp_persons` | main | `pp_archive` | no |
| `pp_locations` | main | `pp_archive` | no |
| `pp_sponsors` | main | `pp_archive` | no |
| `pp_roles` | main (vocabulary) | `pp_archive` | no |
| `pp_navigations` | main | `pp_archive` | no |
| `pp_exhibition_participations` | child of exhibitions | `pp_exhibitions` | yes |
| `pp_exhibition_statements` | child of exhibitions | `pp_exhibitions` | yes |
| `pp_navigation_items` | child of navigations | `pp_navigations` | yes |
| `pp_mm__exhibitions_venues` | structural | `pp_exhibitions` | yes |
| `pp_mm__exhibitions_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__persons_roles` | structural | `pp_persons` | yes |
| `pp_mm__persons_venues` | structural | `pp_persons` | yes |
| `pp_mm__persons_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__locations_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__sponsors_venues` | structural | `pp_sponsors` | yes |
| `pp_translations__exhibitions` | structural | `pp_exhibitions` | yes |
| `pp_translations__venues` | structural | `pp_venues` | yes |
| `pp_translations__locations` | structural | `pp_locations` | yes |
| `pp_translations__sponsors` | structural | `pp_sponsors` | yes |
| `pp_translations__roles` | structural | `pp_roles` | yes |
| `pp_translations__exhibition_statements` | structural | `pp_exhibition_statements` | yes |
| `pp_translations__navigation_items` | structural | `pp_navigation_items` | yes |
| `pp_meta` | installer state, singleton | root | yes |

25 prefixed collections, 26 with the `pp_archive` folder. `pp_persons` and `pp_navigations` have no translation table.

### Relation map

Every line is one relation. The naming rule (conventions §2 rule 12) makes an M2O look like a plain field: `primary_venue` is a relation, not a string.

| From | To | Shape | Field / table | Meaning |
|---|---|---|---|---|
| exhibition | venue | M2O | `pp_exhibitions.primary_venue` | where the show happens; the venue lists its `exhibitions` |
| exhibition | venue | M2M | `pp_mm__exhibitions_venues` | further venues of a travelling show; aliases `further_venues` / `further_exhibitions` |
| venue | location | M2O | `pp_venues.location` | the town the building stands in; the town lists its `venues` |
| participation | exhibition | M2O, child | `pp_exhibition_participations.exhibition` | dies with the show; the show lists `participations` |
| participation | person | M2O | `pp_exhibition_participations.person` | who; the person lists `participations` |
| participation | role | M2O | `pp_exhibition_participations.role` | in which function |
| person | role | M2M | `pp_mm__persons_roles` | what the person can be; aliases `roles` / `persons` |
| statement | exhibition | M2O, child | `pp_exhibition_statements.exhibition` | dies with the show |
| statement | person | M2O | `pp_exhibition_statements.person` | who said it |
| person | venue | M2M | `pp_mm__persons_venues` | the venue represents or works with the person; aliases `venues` / `persons` |
| sponsor | venue | M2M | `pp_mm__sponsors_venues` | aliases `venues` / `sponsors` |
| sponsor | exhibition | M2M | `pp_mm__exhibitions_sponsors` | aliases `exhibitions` / `sponsors` |
| sponsor | person | M2M | `pp_mm__persons_sponsors` | aliases `persons` / `sponsors` |
| sponsor | location | M2M | `pp_mm__locations_sponsors` | aliases `locations` / `sponsors` |
| navigation item | navigation | M2O, child | `pp_navigation_items.navigation` | which menu |
| navigation item | navigation item | M2O, self | `pp_navigation_items.parent` | group nesting |

**Exhibition → location is deliberately absent.** Exhibition → venue → location is one chain.

Junction ownership in the sidebar (conventions §3 rule 1): under the parent whose form lists it, alphabetical as tie-break.

### Fields

Rules applied everywhere (conventions §2, §8):

- Headline column is `title`. `venues.name`, `locations.city_name` and `sponsors.name` became `title` on 2026-09-14. Persons keep `first_name` + `last_name`.
- M2O on an entity is named by meaning, singular: `location`, `primary_venue`, `exhibition`, `person`, `role`, `navigation`, `parent`.
- Junction and translation FKs are `<parent>_id` after the collection without prefix: `exhibitions_id`, `persons_id`, `roles_id`, `languages_code`.
- Translated columns carry the note `Translated field for <host>.<column>`.

#### `pp_locations`

`id`, `status`, `sort`, `title`, `slug` (unique), `postal_code`, `state`, `country`, `latitude`, `longitude`, `description` (English), `translations`, `venues` (o2m), `sponsors` (m2m), audit.
Translated: `description`.

#### `pp_venues`

`id`, `status`, `sort`, `title`, `slug`, `location` (M2O → locations, SET NULL), `type` (dropdown, allow other), `address`, `website_url`, `latitude`, `longitude`, `image`, `image_alt`, `hero_image`, `hero_image_alt`, `archive_number`, `featured`, `description`, `lede`, `about` (json array of paragraphs), `image_caption`, `coordinate_label`, `translations`, `exhibitions` (o2m), `further_exhibitions`, `persons`, `sponsors` (m2m), audit.
Translated: `description`, `lede`, `about`, `image_caption`, `coordinate_label`.

#### `pp_persons`

`id`, `status`, `sort`, `first_name`, `last_name`, `middle_initial`, `display_name` (was `artist_name` in the JSON before 2026-09-14) (pseudonym or collective name, shown instead of first + last when set), `slug` (unique), `website_url`, `roles`, `venues`, `sponsors` (m2m), `participations` (o2m), audit.
No translations.

#### `pp_roles`

`id`, `status`, `sort`, `title` (English), `slug` (unique: `artist`, `curator`), `translations`, `persons` (m2m), audit.
Translated: `title`. Seeded: artist ("Artist" / "Künstler:in"), curator ("Curator" / "Kurator:in").

#### `pp_exhibitions`

`id`, `status`, `sort`, `title`, `slug`, `primary_venue` (M2O → venues, SET NULL), `start_date`, `end_date`, `is_permanent`, `image`, `image_alt`, `summary`, `description` (markdown, English), `date_range`, `opening_hours`, `vernissage`, `medium`, `source_pdf`, `tour`, `tour_status`, `tour_available_from`, `translations`, `participations`, `statements` (o2m), `further_venues`, `sponsors` (m2m), audit.
Translated: `title`, `summary`, `description`, `date_range`, `opening_hours`, `vernissage`, `image_alt`, `medium`.

#### `pp_exhibition_participations` (child)

`id`, `status`, `sort`, `exhibition` (M2O → exhibitions, CASCADE, NOT NULL), `person` (M2O → persons, SET NULL), `role` (M2O → roles, SET NULL), audit. `display_template` `{{person.first_name}} {{person.last_name}} · {{role.title}}`.

#### `pp_exhibition_statements` (child)

`id`, `status`, `sort`, `exhibition` (M2O → exhibitions, CASCADE, NOT NULL), `person` (M2O → persons, SET NULL), `prompt`, `statement`, `translations`, audit.
Translated: `prompt`, `statement`.

#### `pp_sponsors`

`id`, `status`, `sort`, `title`, `slug` (unique), `website_url`, `logo` (file), `description` (English), `translations`, `venues`, `exhibitions`, `persons`, `locations` (m2m), audit.
Translated: `description`.

#### `pp_navigations`

`id`, `status`, `sort`, `title` (admin label), `key` (unique: `main`, `footer`), `items` (o2m, by `sort`), audit.

#### `pp_navigation_items` (child)

`id`, `status`, `sort`, `navigation` (M2O → navigations, CASCADE, NOT NULL), `parent` (self M2O, SET NULL), `key` (stable identifier), `title` (English), `kind` (dropdown `route` | `url` | `action`), `path`, `url`, `target` (`_self` | `_blank`), `children` (o2m), `translations`, audit.
Translated: `title`. Route paths are locale-neutral; the frontend passes them through `localePath()`.

#### Structural junctions

`pp_mm__exhibitions_venues`, `pp_mm__exhibitions_sponsors`, `pp_mm__persons_roles`, `pp_mm__persons_venues`, `pp_mm__persons_sponsors`, `pp_mm__locations_sponsors`, `pp_mm__sponsors_venues`: each `id`, `<a>_id`, `<b>_id` (CASCADE, NOT NULL, indexed), `sort`. Aliases on both ends, plural, `list-m2m`.

#### `pp_meta` (singleton, hidden)

`id`, `schema_version`, `applied_at`. Written by the schema script.

### Relations (conventions §5)

| Where | `on_delete` | `one_deselect_action` |
|---|---|---|
| structural FKs (`mm__`, `translations__`) | CASCADE | delete |
| child → host (`participations.exhibition`, `statements.exhibition`, `navigation_items.navigation`) | CASCADE | delete |
| entity M2O (`venues.location`, `exhibitions.primary_venue`, `participations.person`, `participations.role`, `statements.person`, `navigation_items.parent`) | SET NULL | nullify |
| file fields → `directus_files` | SET NULL | nullify |
| audit → `directus_users` | SET NULL | nullify |

Never `NO ACTION`. Every FK indexed. No unique index on a FK.

### Deferred

Designed, not yet built. Each waits for its own spec or its first consumer.

#### Content blocks and `pp_mm__exhibitions_files__documents`

Own spec (2026-09-14 design's "Blocks: later"). Reserved names: `pp_block_richtext`, `pp_block_header`, `pp_block_images` + `pp_block_image_items`, one `pp_m2a__<host>__blocks` junction per host (exhibitions, venues, persons, locations) with a shared allowed list, and `pp_mm__exhibitions_files__documents` for attaching source documents to a show.

- **`panoramas`** — for a native 360° viewer. `id` UUID, `exhibition` M2O → `pp_exhibitions`, `image_file` File (the 12K optimised target), `altitude` Dropdown (`bird`, `human`, `dog`), `sort`, `photographer_credit`, `capture_date`. No consumer yet: tours today are exported folders referenced by `pp_exhibitions.tour`.
- **`hotspots`** — links between panoramas. `id` UUID, `source_panorama` / `target_panorama` M2O → `panoramas`, `yaw`, `pitch`, `target_arrival_yaw`, `icon_type` Dropdown (`arrow_up`, `arrow_down`, `info`). Depends on `panoramas`.

---

## 3. Frontend Stack Baseline Configurations (Nuxt 4, Vite, JSON-First)

The first implementation task is to create a new child folder named `frontend` and set up the Nuxt 4 application there. Nuxt 4 uses Vite as its development/build engine; the project must be configured and documented from inside `frontend/`.

Initial frontend constraints:

* Use `frontend/` as the only application folder.
* Use Nuxt 4 with TypeScript and Vite.
* Use Tailwind CSS v4 for styling.
* Use local JSON files as the only data source for the first build.
* Do not require Directus, PostgreSQL, Docker, Hetzner, or Cloudflare to run the first landing page.
* Keep the JSON data model compatible with the future Directus schema.
* Use `_Plans/designs/landing-page/` as the visual source of truth for the first page.

Recommended initial data layout:

```text
frontend/
  app/
    assets/css/main.css
    components/
    data/
      locations.json
      venues.json
      artists.json
      exhibitions.json
      sponsors.json
    pages/index.vue
    types/content.ts
  public/
    images/
      landing/
  nuxt.config.ts
  package.json
```

The landing-page design images should be copied or re-exported into `frontend/public/images/landing/` only when they are needed by the running prototype. Until then, `_Plans/designs/landing-page/` remains the planning source.

### Styling Setup: Tailwind CSS v4 Architecture

Tailwind v4 abandons `tailwind.config.js` in favor of a modern, native CSS-driven implementation. All design tokens are loaded directly inside the global entrypoint file.

```css
/* assets/css/main.css */
@import "tailwindcss";

@theme {
  --color-archive-paper: #f3eadc;
  --color-archive-ink: #1c1915;
  --color-archive-muted: #786f62;
  --color-archive-line: #cbbda7;
  --color-archive-rust: #a9523c;
  --color-archive-copper: #b8794f;
  --color-gallery-background: #14110d;
  --color-gallery-overlay: rgba(20, 17, 13, 0.85);
  
  --font-display: "Cormorant Garamond", "Georgia", serif;
  --font-body: "Inter", sans-serif;
  
  --animate-crossfade-in: fade-in 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@layer base {
  body {
    @apply bg-archive-paper text-archive-ink font-body antialiased selection:bg-archive-rust/20;
  }
}

```

### Data Layer: Local JSON First, Directus-Compatible Later

The first implementation must load typed local JSON data. Directus SDK integration is deferred until after the landing page and base frontend shell are working. Keep the model names aligned with the future Directus schema so the data source can later be swapped behind a repository/composable layer.

```typescript
// app/types/content.ts
export interface LocationTranslation {
  languages_code: string;
  description: string;
}

export interface Location {
  id: string;
  slug: string;
  city_name: string;
  postal_code: string;
  state: string;
  country: string;
  translations: LocationTranslation[];
}

export interface Panorama {
  id: string;
  exhibition_id: string;
  image_file: string;
  altitude: 'bird' | 'human' | 'dog';
}

export interface AppContent {
  locations: Location[];
  panoramas: Panorama[];
  /* Remaining structural mappings mapped identically */
}

// app/composables/useArchiveData.ts
import locations from '~/data/locations.json';
import exhibitions from '~/data/exhibitions.json';
import artists from '~/data/artists.json';
import sponsors from '~/data/sponsors.json';

export function useArchiveData() {
  return {
    locations,
    exhibitions,
    artists,
    sponsors
  };
}

```

Directus SDK configuration should be introduced in a later phase as a replacement data adapter, not as a prerequisite for the first frontend build.

---

## 4. Technical Engineering Rules (Non-Negotiables)

### Rule A: GPU VRAM Leak Prevention (Concentric Sphere Swap)

A decoded 12,000 $\times$ 6,000px equirectangular image consumes approximately 288 MB of pure, uncompressed Video RAM. Under no circumstances may more than **two** panorama textures stay active simultaneously in the WebGL context. The old texture must be aggressively purged on transition completion.

```typescript
// composables/usePanoramaTexture.ts
import * as THREE from 'three';

export function usePanoramaTexture() {
  const textureLoader = new THREE.TextureLoader();

  const loadWebGLTexture = (url: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      textureLoader.load(url, (texture) => {
        // Enforce optimization parameters for equirectangular maps
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false; 
        resolve(texture);
      }, undefined, reject);
    });
  };

  const safelyDisposeMesh = (mesh: THREE.Mesh | null) => {
    if (!mesh) return;
    
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    
    if (mesh.material) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.dispose(); // Kill texture link inside VRAM
      }
      mat.dispose(); // Kill shader material allocation
    }
    
    mesh.parent?.remove(mesh);
  };

  return { loadWebGLTexture, safelyDisposeMesh };
}

```

### Rule B: Isolated WebGL Rendering State

To maintain steady 60fps rendering, the Three.js requestAnimationFrame cycle must remain completely detached from Nuxt's reactive loop (do not wrap Three.js objects inside `ref`, `reactive`, or pinia stores). Pass navigation triggers using primitive events or explicit function arguments.

```typescript
// components/GalleryViewer.vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { usePanoramaTexture } from '~/composables/usePanoramaTexture';

const props = defineProps<{ panoramaUrl: string; nextPanoramaUrl?: string }>();
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Pure unreactive state variables - invisible to Vue tracking loop
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let currentSphere: THREE.Mesh;
let targetSphere: THREE.Mesh;

const { loadWebGLTexture, safelyDisposeMesh } = usePanoramaTexture();

const executeCrossfadeTransition = async (nextUrl: string, targetYaw: number) => {
  // 1. Fetch next texture from browser network cache instantly into WebGL
  const nextTexture = await loadWebGLTexture(nextUrl);
  
  // 2. Setup target sphere immediately inside current visible sphere
  const geometry = new THREE.SphereGeometry(490, 60, 40);
  geometry.scale(-1, 1, 1); // Invert vectors inward
  const material = new THREE.MeshBasicMaterial({ map: nextTexture, opacity: 0, transparent: true });
  targetSphere = new THREE.Mesh(geometry, material);
  scene.add(targetSphere);

  // 3. Coordinate optical illusion via GSAP
  const tl = gsap.timeline({
    onComplete: () => {
      // Clean up past mesh allocation entirely
      safelyDisposeMesh(currentSphere);
      currentSphere = targetSphere;
      camera.fov = 75; // Reset optical expansion
      camera.updateProjectionMatrix();
    }
  });

  // Lens Zoom Forward
  tl.to(camera, { fov: 40, duration: 0.6, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix() }, 0);
  // Fade In Target Sphere Material
  tl.to(targetSphere.material, { opacity: 1, duration: 0.6, ease: 'linear' }, 0);
  // Orient Camera toward the assigned Target Arrival View
  tl.to(camera.rotation, { y: targetYaw, duration: 0.6, ease: 'power2.inOut' }, 0);
};

onMounted(() => {
  if (!canvasRef.value) return;
  // Initialize baseline Three.js renderer loops...
});

onBeforeUnmount(() => {
  safelyDisposeMesh(currentSphere);
  safelyDisposeMesh(targetSphere);
  renderer?.dispose();
});
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <canvas ref={canvasRef} class="absolute inset-0 w-full h-full" />
  </div>
</template>

```

### Rule C: Lazy Background Network Caching

When an exhibition page loads, execute background requests using simple HTML image elements. This forces the browser to pull assets over the wire into local disk/RAM cache without generating WebGL texture objects prematurely.

```typescript
// utils/preloadGalleryAssets.ts
export function preloadPanoramasToCache(urls: string[]): void {
  if (typeof window === 'undefined') return;
  
  urls.forEach((url) => {
    const img = new Image();
    img.src = url; // Leverages browser cache mechanisms automatically
  });
}

```

---

## 5. Detailed Process Tracker

```
[x] PHASE 1: REPOSITORY SETUP & CORE INTEGRATION
    ├── [x] Create child folder: frontend/
    ├── [x] Scaffold clean Nuxt 4 workspace in frontend/ with TypeScript strict modes enabled
    ├── [x] Confirm Nuxt is using Vite and document commands from inside frontend/
    ├── [x] Install development dependencies: tailwindcss @tailwindcss/vite gsap three @types/three
    ├── [x] Initialize app/assets/css/main.css containing Tailwind v4 @theme blocks
    ├── [x] Create local JSON data files under frontend/app/data/
    ├── [x] Create typed JSON data composable/repository layer
    └── [x] Do not add Directus runtime dependency in this phase

[ ] PHASE 2: LANDING PAGE FRONTEND BASIS FROM DESIGN MOCKUPS
    ├── [x] Build responsive app shell with PERMAPHEMERA header, navigation, language switcher, and mobile menu
    ├── [x] Implement hero section from desktop and mobile hero mockups
    ├── [x] Implement locations/galleries section using Parkschlössl as the first featured venue
    ├── [x] Implement selected exhibitions section with featured 360° record and record list
    ├── [x] Implement artists archive section with search field, alphabet filter, and archive metadata sidebar
    ├── [x] Implement how-to-navigate/archive-method section with three-step method cards
    ├── [x] Implement supporters/footer section, preferring the dark footer variant unless later changed
    └── [ ] Verify desktop and mobile layouts against _Plans/designs/landing-page/ images

[ ] PHASE 3: COMPONENT DEVELOPMENT & TEXTURE SAFETY PIPELINE
    ├── [ ] Implement usePanoramaTexture abstraction ensuring explicit .dispose() execution
    ├── [ ] Code background asset preload asset script utilizing standard browser disk cache pools
    ├── [ ] Build full-screen WebGL component managing concentric Sphere A and Sphere B placements
    └── [ ] Wire up GSAP timelines coordinating synchronized FOV manipulation and material alpha animations

[ ] PHASE 4: FUTURE DATABASE ARCHITECTURE CONFIGURATION
    ├── [x] Install Directus 11.17.4 locally (Docker, `directus/`, port 8077) — 2026-09-14
    ├── [x] Rebuild all collections by the pp_ conventions from `directus/scripts/schema.mjs`, incl. persons/roles/participations, sponsors, navigations — 2026-09-14
    ├── [x] Seed languages (en, de), roles and the two navigations — 2026-09-14
    ├── [x] Rename the frontend JSON, types and resolvers to the pp_ shape; header and footer read the navigations (plan part 2) — 2026-09-14
    ├── [ ] Import the JSON records from frontend/app/data into Directus
    ├── [ ] Introduce Directus SDK data adapter behind the existing JSON-compatible content model
    └── [ ] Test data query payload outputs using Directus SDK deep filtering for locale switching

[ ] PHASE 5: THE DIRECTUS CALIBRATION EXTENSION
    ├── [ ] Initialize native Directus Interface Extension boilerplate utilizing Vue 3
    ├── [ ] Mount dual Three.js viewports inside layout container canvas panel
    ├── [ ] Code left canvas event listener saving coordinates on targeted source sphere meshes
    └── [ ] Link right preview canvas binding scroll movements directly to target_arrival_yaw field data

[ ] PHASE 6: USER FLOW FRONTEND WIRING
    ├── [ ] Synchronize existing localized layout routing mechanisms from reference template repository
    ├── [ ] Build entry directory pages displaying locations -> venues -> exhibition listings
    ├── [ ] Implement on-demand share view listener stringifying parameters (?spot=&yaw=&pitch=)
    └── [ ] Build deep link router parsing hook executing initial scene placement override on mount

[ ] PHASE 7: OPTIMIZATION AND AUDIT CHECKLIST
    ├── [ ] Verify VRAM ceilings via Google Chrome allocation profile logs (Confirm max 2 active textures)
    ├── [ ] Confirm responsive touch gestures and view transformations hold stable on mobile devices
    └── [ ] Deploy production build targeting live infrastructure environment

```
