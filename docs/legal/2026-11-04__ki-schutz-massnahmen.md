# Schutz der Inhalte von permaphemera.at vor KI-Auslese

**Bericht über die technischen und rechtlichen Maßnahmen**

Stand: 4. November 2026 · Website: https://permaphemera.at · Betreiber: Robert Wildling
(Medieninhaber laut Impressum)

## 1. Gegenstand

Die Website PERMAPHEMERA zeigt temporäre Kunstausstellungen in österreichischen Galerien:
Fotografien von Ausstellungen und Kunstwerken, Texte und 360°-Rundgänge. Die Rechte an
Fotografien und Kunstwerken liegen bei den jeweiligen Urheber:innen, Kunstschaffenden,
Fotograf:innen und Institutionen.

Dieser Bericht beschreibt, welche Maßnahmen seit dem 4. November 2026 bestehen, damit diese
Inhalte nicht für das Training von KI-Systemen, für Bilddatensätze oder für das Erzeugen
ähnlicher Werke ausgelesen werden. Er beschreibt auch, wo die Grenzen dieser Maßnahmen liegen
und welche weiteren Schritte geplant sind.

## 2. Rechtliche Grundlage

- **§ 42h Abs. 6 UrhG (Österreich):** Vervielfältigungen für Text und Data Mining sind nicht
  frei zulässig, wenn der Rechteinhaber sie ausdrücklich untersagt hat. Bei Werken, die im
  Internet öffentlich zugänglich sind, muss dieser Nutzungsvorbehalt in maschinenlesbarer Form
  erfolgen.
- **Art. 4 Abs. 3 der Richtlinie (EU) 2019/790 (DSM-Richtlinie):** die europäische Grundlage
  dieses Vorbehalts.
- **Verordnung (EU) 2024/1689 (KI-Verordnung), Art. 53 Abs. 1 lit. c:** Anbieter von
  KI-Modellen mit allgemeinem Verwendungszweck müssen eine Strategie zur Einhaltung des
  Urheberrechts der Union haben, insbesondere um einen solchen Vorbehalt zu ermitteln und
  einzuhalten.

PERMAPHEMERA erklärt den Vorbehalt auf fünf voneinander unabhängigen Wegen (Abschnitt 3), in
maschinenlesbarer Form und in den Nutzungsbedingungen.

## 3. Umgesetzte Maßnahmen

Alle Maßnahmen gelten seit 4. November 2026 für die gesamte Website, alle Seiten, alle Bilder
und alle 360°-Rundgänge. Sie sind in der Versionsverwaltung des Projekts als Version 0.0.47
festgehalten.

### 3.1 robots.txt: Sperre der KI-Crawler

Datei: https://permaphemera.at/robots.txt

robots.txt ist der Standard (RFC 9309), mit dem eine Website automatischen Programmen
(Crawlern) sagt, was sie lesen dürfen.

**a) Vollständig gesperrt** sind Crawler, die Inhalte für das Training von KI-Modellen oder für
Datensätze sammeln (`Disallow: /`):

GPTBot (OpenAI), ClaudeBot und anthropic-ai (Anthropic), CCBot (Common Crawl),
Google-Extended (Google, Training von Gemini), GoogleOther (Google), Applebot-Extended (Apple),
meta-externalagent und FacebookBot (Meta), Bytespider (ByteDance), Amazonbot (Amazon),
cohere-ai und cohere-training-data-crawler (Cohere), Diffbot, ImagesiftBot, img2dataset,
Omgilibot, Timpibot, AI2Bot und Ai2Bot-Dolma (Allen Institute for AI), PanguBot (Huawei),
Kangaroo Bot. Zusammen 22 Kennungen.

**b) Teilweise gesperrt** sind KI-Such- und Antwortdienste, die eine Seite abrufen, wenn eine
Person einer KI eine Frage stellt. Sie dürfen Seiten lesen, aber keine Bilder und keine
360°-Rundgänge (`Disallow: /cms/assets/` und `Disallow: /media/`):

OAI-SearchBot und ChatGPT-User (OpenAI), Claude-SearchBot und Claude-User (Anthropic),
PerplexityBot und Perplexity-User (Perplexity), DuckAssistBot (DuckDuckGo), MistralAI-User
(Mistral). Zusammen 8 Kennungen.

**c) Nicht betroffen** sind Suchmaschinen wie Google und Bing. Die Website bleibt in der
normalen Suche auffindbar. Die Sperre von „Google-Extended" betrifft nur das KI-Training von
Google, nicht die Google-Suche.

### 3.2 TDM-Vorbehalt nach dem TDMRep-Protokoll

Datei: https://permaphemera.at/.well-known/tdmrep.json

TDMRep ist ein Protokoll einer W3C Community Group, mit dem Rechteinhaber den Vorbehalt nach
Art. 4 DSM-Richtlinie maschinenlesbar erklären. Die Datei erklärt den Vorbehalt für die gesamte
Website (`"location": "/*"`, `"tdm-reservation": 1`).

### 3.3 Kennzeichnung in jeder Seite (HTML)

Jede Seite der Website enthält im Kopfbereich:

- `<meta name="tdm-reservation" content="1">`: der TDM-Vorbehalt nach TDMRep;
- `<meta name="robots" content="noai, noimageai">`: die Anweisung, Texte und Bilder nicht für
  KI zu verwenden. Diese Werte sind kein formaler Standard, werden aber von Werkzeugen zum
  Aufbau von Bilddatensätzen ausgewertet.

Seiten mit einer eigenen robots-Anweisung (zum Beispiel nicht zu indexierende Seiten) wiederholen
`noai, noimageai` in dieser Anweisung, damit der Vorbehalt nicht verloren geht.

### 3.4 Kennzeichnung in jeder Server-Antwort (HTTP-Header)

Der Webserver (nginx) sendet bei jeder Antwort, also bei jeder Seite, jedem Bild und jeder
Datei der 360°-Rundgänge, zwei Header:

- `X-Robots-Tag: noai, noimageai`
- `tdm-reservation: 1`

Das ist besonders für Bilder wichtig: Ein Bild hat keinen HTML-Kopf, die Kennzeichnung kann nur
im Header stehen. Das Werkzeug img2dataset, mit dem große Bilddatensätze für KI-Training gebaut
wurden, überspringt nach seinen Standardeinstellungen Bilder mit diesen Headern.

### 3.5 Nutzungsbedingungen

Die Nutzungsbedingungen (https://permaphemera.at/terms/, englisch
https://permaphemera.at/en/terms/) enthalten im Abschnitt „Erlaubte Nutzung" folgende Regeln:

> Eine eigenständige Vervielfältigung, Weiterveröffentlichung, Bearbeitung, automatisierte
> Massenauslese oder kommerzielle Nutzung von Texten, Bildern und 360°-Rundgängen ist ohne
> Erlaubnis nicht gestattet.

> Text und Data Mining ist vorbehalten (§ 42h Abs. 6 UrhG), auch zum Training von KI-Systemen.
> Texte, Bilder und 360°-Rundgänge dürfen ohne Erlaubnis nicht für KI-Training,
> Bilddatensätze oder das Erzeugen ähnlicher Werke ausgelesen werden. Der Vorbehalt steht auch
> in maschinenlesbarer Form in robots.txt und /.well-known/tdmrep.json.

## 4. Prüfung am 4. November 2026

Alle Maßnahmen wurden nach der Veröffentlichung auf der öffentlichen Website geprüft.

| Prüfung | Ergebnis |
|---|---|
| https://permaphemera.at/robots.txt | erreichbar; 22 Kennungen gesperrt, 8 teilweise gesperrt, alle anderen (Suchmaschinen) erlaubt |
| https://permaphemera.at/.well-known/tdmrep.json | erreichbar (HTTP 200, `application/json`), Vorbehalt für `/*` |
| Startseite und Ausstellungsseiten, HTML-Kopf | `tdm-reservation` = 1 und `robots` = `noai, noimageai` vorhanden |
| Header einer Seite (`/terms/`) | `X-Robots-Tag: noai, noimageai`, `tdm-reservation: 1` |
| Header eines Ausstellungsbildes (`/cms/assets/…`) | `X-Robots-Tag: noai, noimageai`, `tdm-reservation: 1` |
| Header eines Bildes unter `/media/` | `X-Robots-Tag: noai, noimageai`, `tdm-reservation: 1` |
| Header einer Datei eines 360°-Rundgangs (`/media/tours/…`) | `X-Robots-Tag: noai, noimageai`, `tdm-reservation: 1` |
| Nutzungsbedingungen, deutsch und englisch | beide Regeln aus 3.5 sichtbar |

Jede Person kann diese Prüfung wiederholen: die genannten Adressen im Browser öffnen, oder für
die Header zum Beispiel `curl -I https://permaphemera.at/` ausführen.

## 5. Grenzen der Maßnahmen

Diese Maßnahmen erklären den Vorbehalt auf allen üblichen maschinenlesbaren Wegen und sperren
die bekannten KI-Crawler. Sie sind keine technische Garantie:

- robots.txt, Meta-Tags und Header wirken nur bei Programmen, die sie beachten. Ein Programm,
  das sie bewusst übergeht oder sich als gewöhnlicher Browser ausgibt, wird dadurch nicht
  technisch gehindert. In diesem Fall erfolgt die Auslese entgegen dem erklärten Vorbehalt.
- Die Liste der KI-Crawler ändert sich laufend. Neue Kennungen werden ergänzt, sobald sie bekannt
  werden.
- Inhalte, die vor dem 4. November 2026 bereits ausgelesen wurden, sind davon nicht erfasst.
- Was eine Person mit einem Bildschirmfoto macht, kann eine Website nicht verhindern.

## 6. Geplante weitere Maßnahmen

Noch nicht umgesetzt; in Vorbereitung:

1. **Sperre beim Netzwerkdienst Cloudflare:** Über Cloudflare läuft der gesamte Verkehr der
   Website. Die Einstellung „Block AI bots" sperrt bekannte KI-Crawler schon vor dem Server,
   auch solche, die robots.txt nicht beachten.
2. **Hotlink-Schutz:** Andere Websites können Bilder von PERMAPHEMERA nicht direkt einbinden.
3. **Keine Originalgrößen:** Bilder werden öffentlich nur in den Größen ausgeliefert, die die
   Website anzeigt, nicht als Originaldatei.
4. **Begrenzung der Abrufrate:** Massenhafte Abrufe von Bildern und Rundgängen in kurzer Zeit
   werden gebremst.
5. **Rechteangaben in den Bilddateien:** Rechteinhaber und „Data Mining: verboten" in den
   IPTC/XMP-Daten der ausgelieferten Bilder.

Dieser Bericht wird bei jeder wesentlichen Änderung neu ausgestellt.

---

Robert Wildling, Betreiber von PERMAPHEMERA

Ort, Datum: ______________________________

Unterschrift: ______________________________
