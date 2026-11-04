# Schutz der Inhalte von permaphemera.at vor KI-Auslese

**Bericht über die technischen und rechtlichen Maßnahmen**

Stand: 4. November 2026 · Website: https://permaphemera.at · Betreiber: Robert Wildling
(Medieninhaber laut Impressum)

## 1. Gegenstand

PERMAPHEMERA bewahrt Ausstellungen als 360°-Rundgänge auf. Die Aufnahmen entstehen im
Einverständnis mit der Galerie oder den Inhaber:innen des Ausstellungsorts und mit den
Kunstschaffenden. Nach dem Abbau bleibt die Ausstellung als Rundgang auf der Website
permaphemera.at erhalten, die für alle öffentlich und frei zugänglich ist.

Gezeigt werden Räume, nicht einzelne Kunstwerke: wie eine Ausstellung im Raum eingerichtet war,
wie die Werke zueinander, zum Licht und zur Architektur stehen, welche Blickwinkel, Wege und
welche Atmosphäre entstanden sind. Jede Ausstellung muss diese Anordnung im Raum neu finden.
Ein zweidimensionales Bild in einem Katalog hält sie nicht fest. 360°-Aufnahmen, zu einem
begehbaren Rundgang verbunden (ähnlich wie bei Google Street View), halten sie fest.

Dazu enthält die Website Fotografien von Ausstellungsräumen und Gebäuden, Einladungen und Texte
zu Ausstellungen, Kunstschaffenden und Orten. In den Rundgängen und Bildern sind Kunstwerke zu
sehen. Die Rechte an den Werken bleiben bei den Kunstschaffenden, die Rechte an Fotografien bei
den Fotograf:innen, Institutionen und sonstigen Berechtigten.

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

PERMAPHEMERA erklärt den Vorbehalt auf fünf voneinander unabhängigen Wegen, in
maschinenlesbarer Form und in den Nutzungsbedingungen (Abschnitte 3.1 bis 3.5). Zusätzlich
sperrt der Netzwerkdienst der Website bekannte KI-Trainings-Crawler technisch (Abschnitt 3.6).

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

### 3.6 Technische Sperre beim Netzwerkdienst Cloudflare

Der gesamte Verkehr der Website läuft über den Netzwerkdienst Cloudflare, bevor er den Server
erreicht. Dort gelten seit 4. November 2026 zwei Einstellungen:

- **Sperre der KI-Trainings-Crawler:** Crawler, die Cloudflare als Crawler für KI-Training
  erkennt, erhalten keinen Zugriff (Antwort „403 Forbidden"). Das gilt auch für Crawler, die
  robots.txt nicht beachten. KI-Such- und Antwortdienste sind davon nicht erfasst; für sie
  gilt die Regel aus 3.1 b (Seiten ja, Bilder und Rundgänge nein).
- **Hotlink-Schutz:** Bilder werden nur ausgeliefert, wenn sie von permaphemera.at selbst
  angefordert werden oder ohne Herkunftsangabe (zum Beispiel für die Vorschau eines geteilten
  Links). Fremde Websites können Bilder von PERMAPHEMERA nicht direkt einbinden.

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
| Abruf der Startseite als „GPTBot" (KI-Trainings-Crawler von OpenAI) | gesperrt (HTTP 403) |
| Abruf der Startseite als „Googlebot" (Suchmaschine) | erlaubt (HTTP 200) |
| Bild mit fremder Website als Herkunft (Hotlink) | gesperrt (HTTP 403) |
| Bild von permaphemera.at selbst und ohne Herkunftsangabe | ausgeliefert (HTTP 200) |

Jede Person kann diese Prüfung wiederholen: die genannten Adressen im Browser öffnen, oder für
die Header zum Beispiel `curl -I https://permaphemera.at/` ausführen.

## 5. Grenzen der Maßnahmen

Diese Maßnahmen erklären den Vorbehalt auf allen üblichen maschinenlesbaren Wegen und sperren
die bekannten KI-Crawler. Sie sind keine technische Garantie:

- robots.txt, Meta-Tags und Header wirken nur bei Programmen, die sie beachten. Die Sperre in 3.6
  erfasst nur Crawler, die Cloudflare als solche erkennt. Ein Programm,
  das sie bewusst übergeht oder sich als gewöhnlicher Browser ausgibt, wird dadurch nicht
  technisch gehindert. In diesem Fall erfolgt die Auslese entgegen dem erklärten Vorbehalt.
- Die Liste der KI-Crawler ändert sich laufend. Neue Kennungen werden ergänzt, sobald sie bekannt
  werden.
- Inhalte, die vor dem 4. November 2026 bereits ausgelesen wurden, sind davon nicht erfasst.
- Was eine Person mit einem Bildschirmfoto macht, kann eine Website nicht verhindern.

## 6. Geplante weitere Maßnahmen

Noch nicht umgesetzt; in Vorbereitung:

1. **Keine Originalgrößen:** Bilder werden öffentlich nur in den Größen ausgeliefert, die die
   Website anzeigt, nicht als Originaldatei.
2. **Begrenzung der Abrufrate:** Massenhafte Abrufe von Bildern und Rundgängen in kurzer Zeit
   werden gebremst.
3. **Rechteangaben in den Bilddateien:** Rechteinhaber und „Data Mining: verboten" in den
   IPTC/XMP-Daten der ausgelieferten Bilder.

Dieser Bericht wird bei jeder wesentlichen Änderung neu ausgestellt.

---

Robert Wildling, Betreiber von PERMAPHEMERA

Ort, Datum: ______________________________

Unterschrift: ______________________________
