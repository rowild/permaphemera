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

This section is the **single living schema** for the project. The local JSON files in `frontend/app/data/` mirror it 1:1, and the Directus collections are built from it. When a field changes in one place, change it in all three (JSON, `frontend/app/types/content.ts`, this section) in the same commit.

The design that produced the current shape is `frontend/docs/superpowers/specs/2026-08-12-directus-aligned-data-model-design.md`. That document is a dated record of the decisions and stays as written; this section is where the schema is maintained.

Last reconciled against the JSON files: 2026-09-14.

### Cross-Cutting Rules

**`status`** (`draft` | `published`) belongs on `locations`, `venues`, `artists`, `exhibitions` and `exhibition_statements`. It records provenance, not visibility: while the project is work in progress much of the content is deliberately invented or refers to institutions that are not yet partners, and that data must still render or most pages would be empty. `status` marks which records are real so they can be filtered later without archaeology. The frontend gates this through a single constant, not through conditionals in components.

**Language priority.** All languages are equal *in the frontend*: a record carries a `translations[]` array and the active locale is selected from it, with a `locale → en → first available` fallback. The backend is English-first: English is the language entered in Directus, and every other translation is derived from it. So English is an editorial starting point and an authoring convention, not a privileged field in the data shape.

**Translations.** In the JSON, translations are inline as `translations[]` on the record. In Directus each becomes a child table `<collection>_translations` with `id`, `<collection>_id` (M2O) and `languages_code` (M2O → `languages.code`), plus the translated fields listed per collection below. The child tables are not repeated for every collection; the "Translated fields" line is the definition.

**IDs.** The JSON uses readable string ids (`venue-parkschloessl-spittal-drau`). Directus uses `UUID` primary keys on the core collections and auto-increment integers on the junction and child tables. Slugs, not ids, are the stable public identifier.

**Files.** `image`, `hero_image`, `profile_image` and `source_pdf` are root-relative paths in the JSON (`/media/images/…`). In Directus they are `File` relations.

**Highlighting is not data.** The exhibition schema has no `featured` field. The frontend derives the highlighted exhibition from dates (current, else nearest upcoming, else the first reverse-chronological record). Do not add it. Venues *do* carry `featured`; that is a curated, editorial choice.

### Core Collections

#### `locations` — the geographic place (city or town)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `slug` | String | unique, e.g. `spittal-an-der-drau` |
| `city_name` | String | |
| `postal_code` | String | |
| `state` | String | e.g. `Kärnten` |
| `country` | String | e.g. `Austria` |
| `latitude`, `longitude` | Float | required, town-centre approximation. Becomes one `geo_data` Point in Directus. Powers radius search only; not door-level mapping |
| `status` | Dropdown | `draft` \| `published` |

Translated fields: `description` (Text / Markdown).

#### `venues` — the building

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `slug` | String | unique, e.g. `parkschloessl-spittal-drau` |
| `location_id` | M2O → `locations` | required |
| `name` | String | |
| `type` | Dropdown | `gallery`, `museum`, `kunsthalle`, `art_cafe`, `open_air`, `forum` — see note below |
| `address` | String | |
| `website_url` | String | optional |
| `latitude`, `longitude` | Float | optional, exact building pin. Distinct from the city centroid on `locations` |
| `image` | File | card image |
| `image_alt` | String | |
| `hero_image` | File | optional, venue detail hero |
| `hero_image_alt` | String | optional |
| `archive_number` | String | two-digit display number, e.g. `01` |
| `featured` | Boolean | curated landing-page highlight |
| `status` | Dropdown | `draft` \| `published` |

Translated fields: `description` (Text), `lede` (String, optional), `about` (repeater / JSON array of paragraphs, optional), `image_caption` (String, optional), `coordinate_label` (String, optional, human-readable DMS readout).

A gallery is the most common exhibition venue in this archive, but not the only one. `type` keeps the frontend label flexible: the collective noun stays "Galleries"/"Galerien" while each venue renders its own type label from an i18n key (`venueType.gallery`, `venueType.art_cafe`, …). Add new values here rather than overloading `gallery`. The list is deliberately open — an unknown value must fall back to the generic collective label rather than render a raw enum. Values in use today: `gallery`, `museum`, `kunsthalle`, `forum`.

#### `artists` — people and collectives

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `slug` | String | unique, e.g. `max-mustermann` |
| `first_name` | String | |
| `last_name` | String | |
| `middle_initial` | String | optional |
| `artist_name` | String | optional; pseudonym or collective brand identity |
| `birth_year` | Integer | optional |
| `death_year` | Integer | optional |
| `nationality` | String | optional |
| `website_url` | String | optional |
| `instagram_handle` | String | optional |
| `profile_image` | File | optional |
| `status` | Dropdown | `draft` \| `published` |

Translated fields: `biography` (Text / Markdown).

Placeholder artists keep every optional field `null`; nothing biographical is invented.

#### `exhibitions` — the show

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `slug` | String | unique, e.g. `all-the-magic` |
| `primary_venue_id` | M2O → `venues` | required |
| `start_date` | Date | |
| `end_date` | Date | |
| `is_permanent` | Boolean | default `false` |
| `image` | File | |
| `image_alt` | String | English fallback; also translated |
| `opening_hours` | String | English fallback; also translated |
| `vernissage` | String | English fallback; also translated |
| `medium` | String | optional; English fallback; also translated |
| `source_pdf` | File | optional; the invitation or press sheet the record was derived from |
| `tour` | String | optional; root-relative folder of the exported 360° tour, `/media/tours/<id>/`, or `null` while none is published |
| `tour_status` | Dropdown | `available` \| `restricted` \| `unavailable` — see `frontend/app/utils/tourAccess.ts` |
| `tour_available_from` | Date | optional; the day the 360° record may be shown, usually the day after the analog show closes; `null` means at once |
| `status` | Dropdown | `draft` \| `published` |

Translated fields: `title` (String), `summary` (String, one-line teaser), `description` (Text / Markdown, curatorial statement), `date_range` (String, display form of the dates), `opening_hours` (String), `vernissage` (String), `image_alt` (String), `medium` (String).

> **Open item.** `image_alt`, `opening_hours`, `vernissage` and `medium` exist both on the record (as English fallbacks) and in `translations[]`. Directus needs them in one place only. Decide before creating the collection whether they live in `exhibitions_translations` alone (recommended) or stay on the record as untranslated strings.

#### `exhibition_statements` — an artist's words about one show

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `exhibition_id` | M2O → `exhibitions` | required |
| `artist_id` | M2O → `artists` | required |
| `sort` | Integer | |
| `status` | Dropdown | `draft` \| `published` |

Translated fields: `prompt` (String, the question asked, e.g. "How did you approach the room?"), `statement` (Text, the answer).

The JSON file exists and the resolver reads it, but it holds no rows yet.

#### `sponsors`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `name` | String | |

Rendered in the footer strip. No relations, no translations, no `status`. A `logo` File will be needed once real sponsors exist.

### Junction Collections (Many-to-Many Bridge)

#### `exhibitions_artists`

| Field | Type | Notes |
|---|---|---|
| `id` | Integer | |
| `exhibition_id` | M2O → `exhibitions` | |
| `artist_id` | M2O → `artists` | |
| `sort` | Integer | credit order |

Multi-artist credits are multiple rows. Artists are never joined by name string.

### Deferred Collections

Designed, not yet built in JSON or Directus. Each waits for its first consumer.

#### `exhibitions_locations` — travelling shows

`id` Integer, `exhibition_id` M2O → `exhibitions`, `location_id` M2O → `locations`. Needed the first time one exhibition is shown in more than one place.

#### `panoramas` — for a native 360° viewer

`id` UUID, `exhibition_id` M2O → `exhibitions`, `image_file` File (the 12K optimised target), `altitude` Dropdown (`bird`, `human`, `dog`), `sort` Integer, `photographer_credit` String, `capture_date` Date. Would add `front_door_panorama_id` M2O → `panoramas` on `exhibitions`. Today tours are exported folders referenced by `exhibitions.tour`, so this collection has no consumer.

#### `hotspots` — links between panoramas

`id` UUID, `source_panorama_id` and `target_panorama_id` M2O → `panoramas`, `yaw` Float, `pitch` Float, `target_arrival_yaw` Float, `icon_type` Dropdown (`arrow_up`, `arrow_down`, `info`). Depends on `panoramas`.


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
    ├── [ ] Construct localized Directus collections from §2: locations, venues, artists, exhibitions, exhibition_statements, sponsors, exhibitions_artists
    ├── [ ] Spin up standard system language codes and establish structural _translations links
    ├── [ ] Configure relational M2M junction keys (exhibitions_artists, exhibitions_locations)
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
