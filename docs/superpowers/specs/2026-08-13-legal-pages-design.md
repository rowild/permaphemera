# PERMAPHEMERA Legal and Access Pages Design

Date: 2026-08-13

Status: implemented

## Purpose

The four permanent information routes identify the privately operated project,
explain its current data processing, set rules for respectful use of the
archive, and publish an honest accessibility status. They are durable archive
records, not generic template disclaimers.

## Route and naming contract

- `/imprint/`: “Impressum” / “Imprint”.
- `/privacy/`: “Datenschutzerklärung” / “Privacy Policy”.
- `/terms/`: “Nutzungsbedingungen” / “Terms of Use”. The project currently
  offers no paid service or online contracting, so it must not call this page
  “Allgemeine Geschäftsbedingungen”.
- `/accessibility/`: “Barrierefreiheit” / “Accessibility”. Keep this as its own
  destination while it contains a meaningful target, current status, known
  limitations, and feedback channel.

Every destination is locale-aware and linked from both permanent legal menus.
The shared Contact action uses `office@rowild.at` rather than a placeholder.

## Factual contract

PERMAPHEMERA is currently a private, independently operated project of Robert
Wildling. The imprint gives the supplied Vienna address, email address, and
telephone number and states the editorial direction required for an Austrian
periodical website.

The current frontend uses no advertising, accounts, payments, newsletter form,
or remote embed. It stores a necessary locale cookie and a versioned local
browser record containing independent Matomo, Google Maps, and YouTube choices.
Necessary storage is always selected; every optional service has its own real
checkbox. Hosting is with ALL-INKL.COM – Neue Medien Münnich in Germany. Its published privacy
information says ordinary server logs are deleted after no more than seven
days, with longer retention possible for security incidents.

Self-hosted Matomo at `https://matomo.rowild.at/` with site ID `9` is optional
and consent-gated: its script is not loaded before affirmative consent, SPA
route changes are tracked only while consent remains active, and revocation
stops tracking and deletes Matomo cookies. The complete granular decision
expires locally after at most one year. Google Maps and YouTube are disclosed
as separately consented future services but are not currently embedded or
contacted, even if their prepared preference is selected. The Matomo server's
IP-anonymisation and data-retention settings remain deployment facts that must
be confirmed and reflected in the public policy. A newsletter subscription is
still described only as planned and not active.

## Visual composition

All routes use `ArchiveLegalPage`, which extends the routed parchment shell.
Its hero pairs the legal statement with a compact accountable document record:
document type, project/controller, provider or target standard, and revision
date. This record is the family’s distinctive element and replaces decorative
hero imagery that would carry no legal meaning.

Below the one shared inset divider, the article moves directly into readable
long-form chapters; it does not duplicate those chapter titles in a contents
navigation. `LegalEditorialSection` owns paragraphs, lists, definition records,
contact links, and authoritative source links so repeated legal content markup
does not drift between pages. Successive chapters use whitespace and typography
instead of divider lines. Definition rows remain borderless and align labels
with values on their first text baseline. The hero's clearly labelled document
record is the exception: one quiet top and one quiet bottom rule encompass the
complete unit, with no internal row borders.

Display headings retain explicit lower glyph clearance. Red is reserved for
the conceptual turn, eyebrows, labels, and links. No cut-corner card or extra
ornament is introduced merely to make legal copy decorative.

## Responsive and accessibility contract

Desktop and tablet retain the editorial title/prose split; compact layouts stack
each title immediately above its copy. Sections use scroll margins so anchored
headings are not hidden behind the sticky header. Every route has one H1,
semantic sections, an article landmark, visible linked contact methods, and
external-source links that identify their new-window direction visually.

The accessibility statement targets WCAG 2.2 AA but explicitly records an
internal self-assessment rather than claiming audited conformance. It names
the image wheel, future 360° tours, and external destinations as areas needing
further testing or outside project control, and provides a direct feedback
route.

## Maintenance

Legal content is a factual snapshot. Update the displayed revision date and
affected passages whenever the operator, organisation, hosting, data flow,
analytics, newsletter provider, commercial functions, or accessibility status
changes. Obtain qualified Austrian legal review before treating the drafted
copy as a substitute for professional advice.
