# Newsletter modal and menu link (2026-11-09)

Owner's request: the newsletter gets a link in the footer and in the hamburger menu, and the
invite becomes a centred modal with an image, at most once a month while nobody has signed up.

## Decisions (owner, 2026-11-09)

- **No form in the modal, anywhere.** It only says that a newsletter exists and links
  "Anmelden" / "Sign up" to `/newsletter/`. Same on desktop, tablet and phone.
- **Image: the newest room photo.** First built with the exhibition's main image; that was an
  invitation poster for the newest tour (Trigeniale 26). The owner then chose (2026-11-09) a
  room view cut from the tour: `start-view.jpg`, the view the viewer opens with. The modal
  tries the three newest open tours and shows the first picture that loads; the caption names
  exhibition, gallery and town. Without one: `public/media/images/landing/parkschloessl.jpg`.
- **"Never show again"** link in the modal: stores the same "never" result as a sign-up.
- **Once a month:** the 30 days count from the moment the modal shows (not only from "close").

## Built

1. Directus `pp_navigation_items` `newsletter` (footer, group Information): draft → published.
   The footer and the header menu (which lists the footer groups) show it at once.
2. `app/utils/newsletter.ts`: invite record states `shown`, `dismissed`, `subscribed`, `never`;
   `inviteAllowed` keeps `subscribed` and `never` out for good, the other two for 30 days.
3. `app/utils/tourAccess.ts`: `openTourExhibitions()` (open tour, newest first), shared by the
   hero fan (`heroItems.ts`) and the modal image.
4. `app/components/ArchiveModal.vue`: the one modal frame (backdrop, paper frame, ×, Escape,
   focus trap, scroll lock). `ArtistExhibitionModal` uses it too (no copy of the frame).
5. `app/components/ArchiveNewsletterInvite.vue`: the modal itself; image left (top on phones),
   text, button to `/newsletter/`, small "never show again" link.
6. `scripts/lib/tour-start-view.mjs` + `pnpm tour:start-view [ids…]`: cuts `start-view.jpg`
   (1600×1100, JPEG) out of the start panorama with sharp (new dev dependency, 0.35.5, the
   version already in the tree). `pnpm tour:publish` writes it on every copy. Written for all
   18 tours on 2026-11-09 (3.5 MB). The file name: `shared/tour-access.mjs`.
7. Tests: `test/unit/newsletter.spec.ts`, `test/unit/tourAccess` rules, `test/nuxt/ArchiveModal.spec.ts`,
   `test/nuxt/ArchiveNewsletterInvite.spec.ts`, `test/unit/tour-start-view.spec.ts`,
   `test/e2e/newsletter.spec.ts`.
8. Docs: `frontend/AGENTS.md` "Newsletter" and "360° tours", `PROJECT_INFO.md` (tour flow),
   privacy text (the stored states).

## Open

- Deploy (owner's word): the site, and the 18 tours for their `start-view.jpg`
  (`pnpm deploy:hetzner --tours <ids>`). Until then the live modal is the old corner box.
