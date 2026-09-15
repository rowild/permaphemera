
import { useMemo, useState, type CSSProperties } from "react";
import { galleries, type Gallery } from "./data";
import { AUSTRIA_BOUNDS, austriaStateShapes } from "./austriaMap";

type Segment = "Privat & Handel" | "Öffentlich" | "Kunstvereine" | "Artist-run" | "Weitere";
type StatusFilter = "Alle" | "Aktiv" | "Historisch";

const stateOrder = ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"];
const segmentColors: Record<Segment, string> = {
  "Privat & Handel": "#2456e6", "Öffentlich": "#ff5a36", "Kunstvereine": "#a8c900", "Artist-run": "#8b5cf6", "Weitere": "#151515",
};

function segmentFor(category: string): Segment {
  if (/kommerziell|privatgalerie|kunsthandel|apartment gallery/i.test(category)) return "Privat & Handel";
  if (/stadtgalerie|kommunal|öffentlich|museum|stiftung|bankgalerie|hochschulgalerie/i.test(category)) return "Öffentlich";
  if (/kunstverein|berufsvereinigung|kulturverein|non-profit/i.test(category)) return "Kunstvereine";
  if (/atelier|artist-run|künstler|kollektiv/i.test(category)) return "Artist-run";
  return "Weitere";
}

function plural(count: number, one: string, many: string) { return count === 1 ? one : many; }

function project(lon: number, lat: number) {
  const x = (lon - AUSTRIA_BOUNDS.minLon) / (AUSTRIA_BOUNDS.maxLon - AUSTRIA_BOUNDS.minLon) * AUSTRIA_BOUNDS.width;
  const y = (AUSTRIA_BOUNDS.maxLat - lat) / (AUSTRIA_BOUNDS.maxLat - AUSTRIA_BOUNDS.minLat) * AUSTRIA_BOUNDS.height;
  return { x, y };
}

export default function GalleryDashboard() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<Segment | "Alle">("Alle");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Alle");
  const [mapHistory, setMapHistory] = useState(false);

  const activeGalleries = useMemo(() => galleries.filter(gallery => gallery.active !== false), []);
  const historicCount = galleries.length - activeGalleries.length;
  const stateStats = useMemo(() => stateOrder.map(state => {
    const all = galleries.filter(gallery => gallery.state === state);
    const active = all.filter(gallery => gallery.active !== false);
    return { state, total: all.length, active: active.length, historic: all.length - active.length, cities: new Set(all.map(gallery => gallery.city)).size, activeCities: new Set(active.map(gallery => gallery.city)).size };
  }), []);
  const cityStats = useMemo(() => {
    const counts = new Map<string, { state: string; city: string; active: number; total: number }>();
    for (const gallery of galleries) {
      const key = `${gallery.state}|${gallery.city}`;
      const item = counts.get(key) ?? { state: gallery.state ?? "", city: gallery.city, active: 0, total: 0 };
      item.total += 1;
      if (gallery.active !== false) item.active += 1;
      counts.set(key, item);
    }
    return [...counts.values()].sort((a, b) => b.active - a.active || b.total - a.total || a.city.localeCompare(b.city, "de"));
  }, []);
  const activeCityCount = useMemo(() => new Set(activeGalleries.map(gallery => `${gallery.state}|${gallery.city}`)).size, [activeGalleries]);
  const allCityCount = cityStats.length;
  const categoryStats = useMemo(() => {
    const counts = new Map<Segment, number>();
    for (const gallery of activeGalleries) { const segment = segmentFor(gallery.category); counts.set(segment, (counts.get(segment) ?? 0) + 1); }
    return (Object.keys(segmentColors) as Segment[]).map(name => ({ name, count: counts.get(name) ?? 0 }));
  }, [activeGalleries]);
  const citiesForState = useMemo(() => cityStats.filter(item => !selectedState || item.state === selectedState).sort((a, b) => a.city.localeCompare(b.city, "de")), [cityStats, selectedState]);
  const visibleGalleries = useMemo(() => galleries.filter(gallery => {
    const haystack = `${gallery.name} ${gallery.state} ${gallery.city} ${gallery.address} ${gallery.contacts ?? ""} ${gallery.category} ${gallery.status} ${gallery.email ?? ""}`.toLocaleLowerCase("de");
    const statusMatches = statusFilter === "Alle" || (statusFilter === "Aktiv" ? gallery.active !== false : gallery.active === false);
    return (!selectedState || gallery.state === selectedState) && (!selectedCity || gallery.city === selectedCity) && (selectedSegment === "Alle" || segmentFor(gallery.category) === selectedSegment) && statusMatches && (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase("de")));
  }), [selectedState, selectedCity, selectedSegment, statusFilter, query]);
  const groupedGalleries = useMemo(() => {
    const states = new Map<string, Map<string, Gallery[]>>();
    for (const gallery of visibleGalleries) {
      if (!states.has(gallery.state ?? "")) states.set(gallery.state ?? "", new Map());
      const cities = states.get(gallery.state ?? "")!;
      cities.set(gallery.city, [...(cities.get(gallery.city) ?? []), gallery]);
    }
    return [...states].map(([state, cities]) => ({ state, cities: [...cities].map(([city, items]) => ({ city, items: items.sort((a, b) => a.name.localeCompare(b.name, "de")) })).sort((a, b) => a.city.localeCompare(b.city, "de")) })).sort((a, b) => stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state));
  }, [visibleGalleries]);
  const mapGalleries = useMemo(() => visibleGalleries.filter(gallery => Number.isFinite(gallery.lat) && Number.isFinite(gallery.lon)).filter(gallery => mapHistory || gallery.active !== false).sort((a, b) => Number(a.active !== false) - Number(b.active !== false)), [visibleGalleries, mapHistory]);
  const selectedShape = selectedState ? austriaStateShapes.find(shape => shape.state === selectedState) : null;
  const mapViewBox = selectedShape ? `${Math.max(0, selectedShape.x1 - 22)} ${Math.max(0, selectedShape.y1 - 22)} ${Math.min(1000, selectedShape.x2 + 22) - Math.max(0, selectedShape.x1 - 22)} ${Math.min(430, selectedShape.y2 + 22) - Math.max(0, selectedShape.y1 - 22)}` : "0 0 1000 430";
  const topState = [...stateStats].sort((a, b) => b.active - a.active)[0];
  const topCity = cityStats[0];
  const maxState = Math.max(...stateStats.map(item => item.active));
  let running = 0;
  const donutStops = categoryStats.map(item => { const start = running / activeGalleries.length * 100; running += item.count; return `${segmentColors[item.name]} ${start}% ${running / activeGalleries.length * 100}%`; }).join(",");
  const chooseState = (state: string | null) => { setSelectedState(state); setSelectedCity(null); };
  const resetFilters = () => { setSelectedState(null); setSelectedCity(null); setSelectedSegment("Alle"); setStatusFilter("Alle"); setQuery(""); };
  const filtersActive = selectedState || selectedCity || selectedSegment !== "Alle" || statusFilter !== "Alle" || query;

  return <main id="top">
    <header className="site-header"><a className="wordmark" href="#top" aria-label="GVÖ – Galerienverzeichnis Österreich, zum Seitenanfang">GV<span>Ö</span><small>Galerienverzeichnis Österreich</small></a><nav aria-label="Hauptnavigation"><a href="#statistik">Zahlen</a><a href="#karte">Karte</a><a href="#verzeichnis">Verzeichnis</a></nav><div className="status-pill"><i />Datenstand 25.08.2026</div></header>

    <section className="overview"><div><p className="eyebrow">Österreich · Galerien, Kunsträume & Ausstellungshäuser</p><h1>Die Kunstorte<br /><em>Österreichs.</em></h1><p className="overview-intro">Alphabetisch, durchsuchbar und quellenbasiert – inklusive früherer, geschlossener und derzeit ungeklärter Standorte.</p></div><div className="overview-metrics" aria-label="Kennzahlen"><div><strong>{galleries.length}</strong><span>Einträge<br />insgesamt</span></div><div><strong>{activeGalleries.length}</strong><span>2026<br />aktiv belegt</span></div><div><strong>{historicCount}</strong><span>historisch /<br />ungeklärt</span></div><div><strong>{allCityCount}</strong><span>Städte &<br />Orte</span></div></div></section>

    <section className="state-switcher" aria-label="Bundesland wählen"><button className={!selectedState ? "active" : ""} onClick={() => chooseState(null)}><b>Österreich</b><span>{galleries.length}</span></button>{stateStats.map(item => <button key={item.state} className={selectedState === item.state ? "active" : ""} onClick={() => chooseState(item.state)}><b>{item.state}</b><span>{item.total}</span></button>)}</section>

    <section className="stats-section" id="statistik">
      <div className="stat-lead"><p className="eyebrow">01 · Statistik</p><h2>Wien führt.<br /><em>Die Szene ist bundesweit.</em></h2><p>{topState.state} weist mit {topState.active} aktiv belegten Kunstorten die größte Zahl auf. Außerhalb Wiens bilden Graz, Salzburg, Klagenfurt, Linz und Innsbruck starke regionale Zentren.</p><div className="leader-inline"><span>#01</span><b>{topCity.city}</b><strong>{topCity.active}</strong><small>aktiv</small></div></div>
      <div className="state-ranking"><div className="panel-title"><span>Bundesländer</span><small>aktiv / insgesamt</small></div>{[...stateStats].sort((a, b) => b.active - a.active).map((item, index) => <button key={item.state} onClick={() => chooseState(item.state)}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.state}</b><i><em style={{ width: `${Math.max(3, item.active / maxState * 100)}%` }} /></i><strong>{item.active}<small>/{item.total}</small></strong></button>)}</div>
      <div className="city-ranking"><div className="panel-title"><span>Top-Städte</span><small>aktiv</small></div>{cityStats.slice(0, 9).map((item, index) => <button key={`${item.state}-${item.city}`} onClick={() => { setSelectedState(item.state); setSelectedCity(item.city); }}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.city}<small>{item.state}</small></b><strong>{item.active}</strong></button>)}</div>
      <div className="composition-panel"><div className="panel-title"><span>Betriebstypen</span><small>{activeGalleries.length} aktive Orte</small></div><div className="composition-body"><div className="donut" style={{ background: `conic-gradient(${donutStops})` }}><span><b>{categoryStats.length}</b>Gruppen</span></div><div className="legend">{categoryStats.map(item => <button key={item.name} onClick={() => setSelectedSegment(item.name)}><i style={{ background: segmentColors[item.name] }} /><span>{item.name}</span><b>{item.count}</b></button>)}</div></div></div>
    </section>

    <section className="map-section" id="karte">
      <div className="map-copy"><p className="eyebrow">02 · Präzise Karte</p><h2>{selectedState ?? "Österreich"}<br /><em>auf einen Blick.</em></h2><p>Bundeslandgrenzen nach GADM 4.1. Adresspunkte stammen vorrangig aus dem Gallery Guide; ältere Einträge wurden geocodiert. Kärntner Altbestände und einzelne Restfälle sind transparent als Ortsmittelpunkt gekennzeichnet.</p><div className="map-controls"><button className={!mapHistory ? "active" : ""} onClick={() => setMapHistory(false)}>Nur aktiv</button><button className={mapHistory ? "active" : ""} onClick={() => setMapHistory(true)}>+ historisch</button>{selectedState && <button onClick={() => chooseState(null)}>Ganz Österreich ×</button>}</div><div className="map-readout"><strong>{mapGalleries.length}</strong><span>sichtbare Punkte<br />{selectedState ?? "österreichweit"}</span></div></div>
      <div className="map-frame"><div className="map-legend"><span><i className="active-dot" />aktiv</span><span><i className="historic-dot" />historisch / ungeklärt</span><small>Punkt wählen · Bundesland zum Zoomen wählen</small></div><svg className="austria-map" viewBox={mapViewBox} role="img" aria-label={`Karte der Galerieorte in ${selectedState ?? "Österreich"}`}>{austriaStateShapes.map(shape => <g key={shape.state} className={`state-shape ${selectedState === shape.state ? "is-selected" : ""}`} onClick={() => chooseState(shape.state)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter") chooseState(shape.state); }}><path d={shape.path} />{!selectedState && <text x={shape.labelX} y={shape.labelY}>{shape.state === "Niederösterreich" ? "NÖ" : shape.state === "Oberösterreich" ? "OÖ" : shape.state}</text>}</g>)}{mapGalleries.map(gallery => { const point = project(gallery.lon!, gallery.lat!); const precision = gallery.coordinatePrecision?.toLocaleLowerCase("de").includes("ort") ? "is-city-center" : ""; return <circle key={gallery.id} className={`gallery-dot ${gallery.active === false ? "is-historic" : "is-active"} ${precision}`} cx={point.x} cy={point.y} r={selectedState ? 2.25 : 1.55} onClick={event => { event.stopPropagation(); setSelectedState(gallery.state ?? null); setSelectedCity(gallery.city); }}><title>{gallery.name} · {gallery.city} · {gallery.active === false ? "historisch/ungeklärt" : "aktiv"} · Position: {gallery.coordinatePrecision}</title></circle>; })}</svg><div className="map-caption"><span>9.5° E</span><b>{selectedState ? `${selectedState.toUpperCase()} · ZOOM` : "ÖSTERREICH · 9 BUNDESLÄNDER"}</b><span>17.2° E</span></div></div>
    </section>

    <section className="directory" id="verzeichnis">
      <div className="directory-heading"><div><p className="eyebrow">03 · Verzeichnis</p><h2>Bundesland. Stadt.<br /><em>Galerie.</em></h2></div><p>Sortiert zuerst nach Bundesland, dann Stadt und Galerie. „Aktiv“ zählt nur bei einem konkreten 2026-Beleg; ältere, geschlossene oder nicht ausreichend bestätigte Treffer bleiben recherchierbar.</p></div>
      <div className="directory-tools"><label className="search-field"><span>Volltext</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Galerie, Ort, Person, E-Mail …" /><b>⌕</b></label><label><span>Bundesland</span><select value={selectedState ?? ""} onChange={event => chooseState(event.target.value || null)}><option value="">Alle Bundesländer</option>{[...stateStats].sort((a, b) => stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state)).map(item => <option key={item.state} value={item.state}>{item.state} ({item.total})</option>)}</select></label><label><span>Stadt / Ort</span><select value={selectedCity ?? ""} onChange={event => setSelectedCity(event.target.value || null)}><option value="">Alle Städte & Orte</option>{citiesForState.map(item => <option key={`${item.state}-${item.city}`} value={item.city}>{item.city} ({item.total})</option>)}</select></label><div className="status-filters"><span>Status</span><div>{(["Alle", "Aktiv", "Historisch"] as StatusFilter[]).map(status => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{status}</button>)}</div></div><div className="type-filters"><span>Gruppe</span><div><button className={selectedSegment === "Alle" ? "active" : ""} onClick={() => setSelectedSegment("Alle")}>Alle</button>{(Object.keys(segmentColors) as Segment[]).map(segment => <button title={segment} aria-label={segment} key={segment} className={selectedSegment === segment ? "active" : ""} onClick={() => setSelectedSegment(segment)}><i style={{ background: segmentColors[segment] }} /></button>)}</div></div><div className="result-count"><strong>{visibleGalleries.length}</strong><span>von {galleries.length}<br />Treffern</span></div></div>
      {filtersActive && <div className="active-filter"><span>Filter</span><b>{[selectedState, selectedCity, statusFilter !== "Alle" ? statusFilter : null, selectedSegment !== "Alle" ? selectedSegment : null, query ? `„${query}“` : null].filter(Boolean).join(" · ")}</b><button onClick={resetFilters}>Alles zurücksetzen ×</button></div>}
      <div className="directory-list">{groupedGalleries.map(stateGroup => <section className="state-group" key={stateGroup.state}><div className="state-index"><span>{String(stateOrder.indexOf(stateGroup.state) + 1).padStart(2, "0")}</span><h3>{stateGroup.state}</h3><p>{stateGroup.cities.reduce((sum, city) => sum + city.items.length, 0)} Einträge · {stateGroup.cities.length} Orte</p></div><div className="state-cities">{stateGroup.cities.map(cityGroup => <section className="city-group" key={`${stateGroup.state}-${cityGroup.city}`}><div className="city-index"><span>{cityGroup.city.charAt(0)}</span><div><h4>{cityGroup.city}</h4><p>{cityGroup.items.length} {plural(cityGroup.items.length, "Eintrag", "Einträge")}</p></div></div><div className="gallery-cards">{cityGroup.items.map(gallery => { const segment = segmentFor(gallery.category); const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gallery.address)}`; const inactiveLabel = /geschlossen|beendet|nicht mehr|dauerhaft geschlossen/i.test(gallery.status) ? "geschlossen / beendet" : "historisch / ungeklärt"; return <article className={`gallery-card ${gallery.active === false ? "is-inactive" : ""}`} key={gallery.id} style={{ "--card-accent": segmentColors[segment] } as CSSProperties}><div className="card-main"><div className="card-title"><span><i />{segment}</span><h5>{gallery.name}</h5></div><div className="card-address"><small>Adresse</small><p>{gallery.address}</p></div><div className="card-contact"><small>Ansprechperson</small><p>{gallery.contacts || "Nicht öffentlich genannt"}</p><em>{gallery.role}</em></div><div className="card-email"><small>E-Mail</small>{gallery.email ? <a href={`mailto:${gallery.email}`}>{gallery.email}</a> : <p className="missing">Keine öffentliche E-Mail</p>}{gallery.moreEmail && <em>{gallery.moreEmail}</em>}</div><div className="card-badges">{gallery.active === false && <span className="record-status">{inactiveLabel}</span>}<span className={`confidence confidence-${gallery.confidence}`}>{gallery.confidence}</span></div></div><details><summary>Details, Status & Recherchehinweis <span>＋</span></summary><div className="details-grid"><div><small>Telefon</small><p>{gallery.phone || "–"}</p></div><div><small>Status 2026</small><p>{gallery.status}</p></div><div><small>Kategorie</small><p>{gallery.category}</p></div><div><small>Kartenposition</small><p>{gallery.coordinatePrecision ?? "ungeklärt"}</p></div>{gallery.note && <div className="note"><small>Recherchehinweis</small><p>{gallery.note}</p></div>}</div></details><div className="card-actions">{gallery.website && <a href={gallery.website} target="_blank" rel="noreferrer">Website ↗</a>}<a href={mapLink} target="_blank" rel="noreferrer">Google Maps ↗</a>{gallery.source && <a href={gallery.source} target="_blank" rel="noreferrer">Quelle ↗</a>}</div></article>; })}</div></section>)}</div></section>)}{!visibleGalleries.length && <div className="empty-state"><strong>0</strong><h3>Kein Treffer.</h3><p>Die gewählten Filter ergeben gemeinsam keinen Eintrag.</p><button onClick={resetFilters}>Filter zurücksetzen</button></div>}</div>
    </section>

    <footer><div className="footer-mark"><span>{activeGalleries.length}</span><p>aktiv belegte Kunstorte<br />in {activeCityCount} Städten & Orten</p></div><div><p>Primärquellen</p><b><a href="https://galleryguide.at/" target="_blank" rel="noreferrer">Gallery Guide Austria 2026 ↗</a><br /><a href="https://www.art-navi.at/index.php/art-Navi.html" target="_blank" rel="noreferrer">Art-Navi / Google-Maps-Links ↗</a></b></div><div><p>Methodik</p><b>Offizielle Websites, Gemeinden,<br />Kulturführer, Google-/Maps-Abgleich</b></div><div><p>Kartenbasis</p><b>GADM 4.1 · Adresspunkte<br />und markierte Ortsmittelpunkte</b></div><a href="#top">Nach oben ↑</a></footer>
  </main>;
}
