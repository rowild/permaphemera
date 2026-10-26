# Text audit: header and footer (every page)

Date: 2026-10-26. Rules: `docs/text-rules.md`. Status: all proposals approved and done (owner, 2026-10-26). The menu group "Archiv" was changed in Directus. What support is for is decided in December or January; see BACKLOG.md.

Decisions: keep · change · delete · check.

## Header

| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Tagline above the logo (`site.headerTagline`) | Ein kuratiertes Archiv von Ausstellungen / A Curated Archive of Exhibitions | change | Value-free (§1.7): no "kuratiert". The scope adds a fact. | Ein Archiv von Ausstellungen in Österreich / An Archive of Exhibitions in Austria |
| Menu (Directus, navigation `main`) | Ausstellungen · Künstler:innen · Galerien · Organisationen | keep | | — |

## Footer: supporters

| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Eyebrow (`footer.supporters`) | Fördernde & Partner:innen / Supporters & partners | keep | | — |
| Header without supporters (`footer.callTitle` + `footer.accent`) | Platz für Institutionen, die kulturelles Gedächtnis bewahren. / Room for institutions that care for cultural memory. | keep | A request for support may persuade (§3, the job of the section); one phrase, not a slogan pair. | — |
| Text (`footer.callText`) | PERMAPHEMERA entsteht mit Partner:innen, denen wichtig ist, was sonst verschwindet. Diese Zeile ist für ihre Namen reserviert: Fördernde, Sponsor:innen und Partnerinstitutionen. Ihrer könnte der erste sein. | change | "Ihrer" addresses the reader (§1.6); "entsteht mit Partner:innen" claims partners the row does not show yet. | Diese Zeile ist für die Namen von Fördernden, Sponsor:innen und Partnerinstitutionen reserviert. Der erste Platz ist noch frei. / This row is kept for the names of supporters, sponsors and partner institutions. The first place is still open. |
| Link (`footer.callLink`) | Kontakt aufnehmen / Get in touch | keep | Control. | — |

What support pays for and how it works is decided in December 2026 or January 2027 (owner);
then this part is revisited. Until then it stays as it is.

## Footer: brand and menus

| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Brand line (`footer.tagline`) | Ein kuratiertes österreichisches Archiv von 360°-Ausstellungsdokumentationen. / A curated Austrian archive of 360-degree exhibition documentation. | change | Value-free (§1.7); a tour is not a "Dokumentation" (§1.1). | Ausstellungen in österreichischen Galerien, festgehalten als 360°-Rundgänge. / Exhibitions in Austrian galleries, captured as 360° tours. |
| Menu group (Directus, navigation `footer`, item `explore`) | Entdecken / Explore | change | Brochure verb (§1.6); the group holds the archive's sections. | Archiv / Archive |
| Its screen-reader name (`footer.exploreAria`) | Entdeckungsnavigation in der Fußzeile / Footer explore navigation | change | Follows the group name. | Archivnavigation in der Fußzeile / Footer archive navigation |
| Menu groups Information, Rechtliches and their links | | keep | | — |
| Seal (image) and its alt text (`footer.sealAlt`) | PERMANENTLY PRESERVED · TEMPORARILY ENDURING | keep | A brand place, like "Fig. I." (§1.4). | — |
| Copyright (`footer.copyright`) | © 2026 PERMAPHEMERA. Alle Rechte vorbehalten. | keep | Legal. | — |
| Bottom right (`footer.curated`) | Unabhängig kuratiert in Österreich. / Curated independently in Austria. | change | Value-free (§1.7). | Ein unabhängiges Projekt aus Österreich. / An independent project from Austria. |

## Error page (every route)

| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Explanation (`site.errorExplanation`) | Die gesuchte Seite ist nicht verfügbar. Von hier aus können Sie zum Archiv zurückkehren. | change | The second sentence repeats the button and says "Sie" (§1.6). | Die gesuchte Seite ist nicht verfügbar. / The page you were looking for is not available. |
| Button (`site.errorHome`) | Zurück zum Archiv / Back to the archive | keep | Control. | — |

## Keep (checked)

`site.seoTitle`, `site.seoDescription`, the loading and error texts, all screen-reader names
except `footer.exploreAria`, the menu labels.
