# Text rules

Rules for every text on PERMAPHEMERA: the locale files (`frontend/i18n/locales/de.json`,
`en.json`), the fixed texts and the SEO texts in Directus, and texts in docs that visitors
see. They apply to every person and every AI that writes or edits such a text. The owner's
rules (§1) come first; where another guide disagrees, they win.

Set up on 2026-10-25 by the owner. Sources: the owner's decisions of 2026-10-14 to
2026-10-25, the "clarify" guide of the impeccable skill (`~/.claude/skills/impeccable/reference/clarify.md`),
and the copy review `website-copy-review-and-ai-brief.md` (2026-10-25, at the repository root).

## 1. The owner's rules

### 1.1 An exhibition is never a "document"

A document is a paper or a digital file, a contract, something to sign. An exhibition is an
exhibition. A 360° tour is a 360° tour. A gallery is a gallery.

| Allowed | Never |
|---|---|
| PERMAPHEMERA dokumentiert Ausstellungen. / documents exhibitions | ein Dokument, räumliche Dokumente, Ausstellungsdokumentationen (as the result) |
| die Dokumentation (the process of documenting) | a document, spatial record, spatial document |
| ein 360°-Rundgang einer Ausstellung / a 360° tour of an exhibition | |

A PDF invitation may stay a document.

### 1.2 "Ausstellung" / "exhibition", never "show"

For `kind: event`: "Veranstaltung" / "event".

### 1.3 Texts inform; it is a website, not a story book

Visitors must find content and know what it is about. Every line adds a fact: where they
are, what a section lists, how it is ordered, what they can find or open there.

- No metaphors and no poetic lines. "Der Augenblick vergeht. Die Anordnung bleibt." and
  "Daten werden Koordinaten." have no value.
- An eyebrow and a title never say the same thing ("Galerienindex" + "Verzeichnis der
  Galerien" is useless).

### 1.4 Headers: one word or a short phrase, like a chapter title

"Zuletzt eröffnet", "Galerien", "So funktioniert das Archiv". Avoid the two-part slogan: two
or three words, a comma or full stop, two or three words again ("Zuletzt eröffnet, jetzt im
Archiv.", "Temporäre Begegnungen. Bleibende Spuren."). It reads as AI text, and it gets
boring when every header has it.

This is a hint, not a law. A comma is fine where the phrase needs it ("Ausstellungen, die
festgehalten werden").

Good examples of a two-part line (owner, 2026-10-25): "Fig. I. Temporary, yet enduring." (the
drawing in the lower left corner of every page, `fig-caption.png`) and the hero line
"Vergängliche Welten. Dauerhaft bewahrt.". They fit because they state the idea of the name
PERMAPHEMERA (ephemeral and permanent) once, in a place made for the brand. The same form
becomes slop when it is the template for every section header. A real distinction is not a slogan: "Aktuelle / kommende
Ausstellungen" names two groups and is a good header. The goal is a good, natural text.

### 1.5 No "wir" / "we" (important)

No "wir", "uns", "unser" / "we", "us", "our": the site does not speak as a person. Only where
a person or the team speaks on purpose: the origin story on the About page, thanks, the
imprint. Third-person pronouns for things ("wie sie gehängt waren") are plain grammar.

### 1.6 Explanations, not instructions; no "Sie" / "you"

Texts explain. They do not tell the visitor what to do, and they do not invite ("Entdecken
Sie …", "Discover …", "Explore …", "Experience …"). Avoid "Sie" / "you" wherever possible.
Rephrase with an infinitive, a noun, a passive or a plain statement:

| Before | After |
|---|---|
| Suchen Sie nach Titel, Künstler:in, Galerie … | Nach Titel, Künstler:in, Galerie … suchen |
| Search across title, artist, gallery … | Search by title, artist, gallery … |
| Entdecken Sie Ausstellungsräume im ganzen Land. | (delete, or state what the list holds) |
| Hier finden Sie alle Galerien. | Alle Galerien des Archivs, nach Orten geordnet. |

Buttons and field labels stay short verbs or nouns ("Suchen", "Search", "Erlebnis
starten"): they are controls, not texts. Legal texts (privacy, imprint) may need to address
the reader; ask the owner before changing them.

### 1.7 Value-free: the archive does not judge

PERMAPHEMERA does not decide what is good or bad, or what belongs in the archive. Every gallery
and exhibition belongs, as long as it respects human rights, freedom of religion and the like.
So no "ausgewählt", "kuratiert", "Kuration" / "selected", "curated", "curation" about
exhibitions, galleries or the archive (owner, 2026-10-25). Say what is there: "Galerien und
Ausstellungsorte in ganz Österreich". A selected language, a selected card or a chosen camera
position is plain interface or process language and stays.

### 1.8 Where a text may think aloud

The section on how a 360° tour is made may reflect a little more (owner, 2026-10-25): why a
room says more than a single photograph, how the works relate to each other. It still states
facts, and it never calls an exhibition a document.

## 2. Word list

| Thing | German | English |
|---|---|---|
| The recorded exhibition, as visitors open it | 360°-Rundgang | 360° tour |
| The act of opening a tour (buttons only) | Erlebnis starten | Start experience |
| An exhibition record | Ausstellung | exhibition |
| A record of `kind: event` | Veranstaltung | event |
| A venue | Galerie (or the venue's own type) | gallery |
| What PERMAPHEMERA does | dokumentieren, festhalten | document, capture |
| What the archive covers | Galerien und Ausstellungsorte in ganz Österreich | galleries and exhibition venues across Austria |
| The project as a whole | Archiv | archive |

Use the same word for the same thing on every page. Do not vary words for style.

Words the owner likes and keeps in mind (2026-10-25): "die Blickachsen zwischen den Werken" /
"the sight lines between the works" (used on the start page), "die Zwiesprache der Werke" (not
used yet). For photos that are not 360°: "Fotos, die nur einen Ausschnitt zeigen" / "photographs
that frame a single view"; never "zweidimensionale Fotos", because a 360° photo is flat too.

## 3. How to work on a text (method)

From impeccable "clarify" and the copy review, adapted to these rules.

1. **Read the whole page**, not single strings: the header outline from top to bottom, then
   each section with what is below it (cards, lists, search). Many problems only show as
   repetition across sections.
2. **Name the job of each section**: navigation, list or index, explanation, the project's
   own story, a request for support, or a control (button, label, status). The job decides
   the register: lists and indexes get a plain header and little or no text; an explanation
   says concretely what happens; the origin story may be personal.
3. **Set the order of the message**: the one fact the visitor needs first, then what can be
   opened or found, then context only where it changes something.
4. **Decide per text**: keep, change, delete, move, or check a fact. Deleting is a valid
   result. A good header stays as it is; do not rewrite good text to show work.
5. **Write the new text** in German and English. The English keeps the meaning and the
   register, not the German word order.
6. **Verify**: read the page again in context, at desktop and phone width. Check facts,
   words from §2, the rules in §1, and the pattern across all headers of the page.

**The test for every line: what would the visitor lose if it disappeared?** If the answer is
"nothing", delete it.

A line under a header earns its place only when it adds scope, an explanation, a status or
a fact that the header and the content below do not already give. "Say each idea once. If
the heading already explains the state, the introduction should add new information or
disappear." (impeccable, clarify)

## 4. Facts

- An exhibition in the archive does not mean it has a 360° tour. A tour can be open,
  scheduled, in preparation, restricted or unavailable (`app/utils/tourAccess.ts`). Never
  write as if every exhibition were a tour.
- Keep an exhibition's dates apart from the tour's publication date.
- Describe continued access ("nach dem Ende der Ausstellung noch zu sehen") without promising
  "forever" or "permanently preserved".
- Do not invent facts, numbers, quotes or stories to make a text sound good. When a fact is
  missing, leave the claim out or ask the owner.
- Never change official exhibition titles, names, quotations or legal wording, even when
  they contain metaphors or two-part phrases.

## 5. Keep what is good

- Concrete facts: dates, places, names, the origin story with its people, place and year.
- Headers that already name their content ("Aktuelle / kommende Ausstellungen").
- The hero line "Vergängliche Welten. Dauerhaft bewahrt." (owner, 2026-10-25): the brand line, kept on purpose. It is the one place for such a line; do not copy its form into other headers.
- Scope: the archive's scope is Austria ("in ganz Österreich", owner 2026-10-25), even while all published galleries are in Carinthia.
- Status texts and labels that say what a control does or what state a tour is in.

## 6. In the code

- A line under a header is optional. A section must look right with a header and nothing
  below it; the component renders no empty paragraph and no empty space for a missing text.
- Never write filler to fill a layout slot.
- Keep headings, form labels, accessible names (`aria-label`) and status messages: they are
  needed even when the visible text gets shorter.

## 7. How a change is made

1. For one page, write an audit table: the current text (de + en), the decision (keep /
   change / delete / move / check), the reason, the new text (de + en).
2. The owner approves the table, or changes it.
3. Change the locale files (and Directus texts, if any), in German and English together.
4. `pnpm check:i18n`, look at the page at 1440 px and 393 px, then release.
