# Contact and How It Works Pages — Design Specification

Status: Implemented
Date: 2026-08-13

## Purpose

PERMAPHEMERA needs two permanent bilingual information routes that explain the
project's working method and provide an accountable, low-friction contact path.
Both pages must feel like part of the editorial archive rather than generic
service or marketing pages.

## Route contract

- German routes: `/how-it-works/` and `/contact/`.
- English routes: `/en/how-it-works/` and `/en/contact/`.
- Header and footer information links use these real localized routes.
- Locale switching preserves the equivalent page.

## How It Works

The page opens with the established documentary collage and explains that
curatorial selection happens before capture. Its central sequence reuses the
archive-method stages—captured, connected, and preserved—then expands the
process through editorial sections covering exhibition selection, linked
360-degree viewpoints, contextual information, and long-term access.

Copy must not imply that every exhibition is accepted or that the virtual
record replaces an in-person visit. The page ends with a restrained path to
Contact for suitable proposals or questions.

## Contact

The page identifies Robert Wildling as the private project owner and exposes
the supplied postal address, email address, and telephone number. It explains
appropriate reasons to write: exhibition proposals, corrections, cooperation,
and accessibility feedback. It also states what information makes a first
message useful and that inclusion remains a curatorial decision.

There is no contact form in this phase. Direct email and telephone links avoid
introducing unspecified backend storage, retention, or anti-spam processing.
The compact contact record uses only one top and one bottom rule around the
complete unit; its internal rows remain borderless.

## External application hints

Email and telephone actions use the shared `ArchiveActionHint` cut-corner
surface. On pointer hover and keyboard focus it appears above the action with a
subtle fade, scale, lift, and archival tilt, and its pointer aims at the
trigger. The hint is absolutely positioned and cannot affect page layout. Each
button references its hint through `aria-describedby`; reduced-motion removes
the transition. Touch activation remains immediate and does not add a
confirmation step.

## Layout and responsive behavior

Both pages reuse `ArchiveEditorialSection`: a narrow eyebrow/title column and a
wider prose column on desktop, collapsing to one column at the shared tablet
breakpoint. Chapters use whitespace and typography instead of repeated rules.
Buttons wrap cleanly on compact screens, and the contact record collapses its
label/value structure without losing reading order.

## Deferred work

A contact form may be considered only after its delivery provider, data
retention, anti-spam measures, failure states, consent requirements, and privacy
copy are defined together.
