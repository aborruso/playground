# Zenodo DTM — piano approvato

## Specifica
Mappa browser del DTM Zenodo 18921767, inizialmente sui crateri sommitali dell'Etna (37.75 N, 14.99 E). Lettura HTTP Range diretta, nessun proxy o download integrale. OpenLayers con GeoTIFF e CRS nativo EPSG:6875. Risoluzione fissa 5 metri per pixel CSS; solo pan, nessuno zoom o rotazione. Rilievo ombreggiato e contatori dei byte effettivamente letti dal browser (non degli overhead HTTP), richieste e tempo iniziale. Gli errori remoti devono essere visibili.

## Fase 1 — lettura
- [x] Verificare Range, COG, CRS e risoluzione: 206, COG valido senza overviews, EPSG:6875, 5 m.
- [x] Scrivere test per zoom fisso e protezione dal download integrale, verificarli rossi.

## Fase 2 — costruzione
- [x] Implementare pagina, sorgente diretta e contatori.
- [x] Test unitari e build: 30 test passati, inclusi taglio, hillshade, URL e layout.

## Fase 3 — verifica
- [ ] Browser: rendering reale, risposta 206, pan e zoom bloccato.
- [ ] Annotare byte e tempi misurati e istruzioni di avvio.

## Domande irrisolte
- Nessuna. La velocità è da misurare, non garantire.

## Review
Prova headless: letti 9.306.117 byte con 5 risposte 206 per gli indici. WebGL non disponibile nel browser automatizzato, quindi rendering DTM e tempi ancora NON verificati. Evitato falso successo su rendercomplete della sola base OSM. Pagina aperta nel browser Windows dell'utente.

## Aggiunte approvate
- [x] Default Etna (37.75000, 14.99000), mantenendo priorità alle coordinate condivise nell'URL; verificato nel browser senza frammento, dist ricompilata.
- [x] Open Graph e Twitter Card large image: titolo, descrizione, URL canonico e immagine assoluta per `https://dainty-kashata-4413d4.netlify.app/`; PNG 1200×630 da rilievo reale di Palermo, 453.147 byte. Build `dist` verificata e aperta per aggiornamento manuale Netlify. Pubblicazione finale dei nuovi asset ancora da confermare.
- [x] Mirino al centro esatto e quota originale del pixel DTM; etichette AGEA/RILIEVO spostate in alto. Lettura asincrona al pan con scarto delle risposte obsolete, nodata e caricamento espliciti.
- [x] Quota verificata a lon=12.5, lat=41.82879: browser «52,0 m», terrio pixel-info 51.96332931518555 m. Nessun dato fuori copertura; screenshot desktop/mobile in `../tmp/zenodo-crosshair-*.png`.
- [x] Doppio clic sulla mappa centra il pixel selezionato: doppio clic reale a [600,300] verificato, errore centro 0 m, risoluzione 5 m invariata e quota aggiornata (36,3 m).
- [x] Info automatiche alla prima visita con `localStorage` (`zenodo-dtm:intro-seen`), senza cookie; seconda visita chiusa e riapertura manuale verificate nel browser. Storage bloccato gestito senza fermare la mappa.
- [x] Crediti AGEA nel tooltip del titolo e nel popup: ente, voli 2022/2023/2024, link al geoportale e licenza CC BY 4.0.
- [x] Mobile essenziale sotto 700 px: titolo/pannelli/minimappa/footer nascosti, pulsanti 48×48, scala e attribuzioni visibili, info fullscreen con chiusura sticky. Verifica a 320×568 e 390×844, nessun overflow; screenshot `../tmp/zenodo-mobile-final.png` e `../tmp/zenodo-mobile-fullscreen-info.png`.
- [x] Base AGEA predefinita: tre WMTS scoperti via openrndt, annate 2022/2023/2024 sovrapposte in quest'ordine, senza mosaico unico o selezione geografica. Tile reali 200 e screenshot ortofoto verificati.
- [x] Radio OSM/AGEA sotto La mia posizione su desktop; un solo pulsante toggle senza testo su mobile. Etichetta centrale e attribuzioni sincronizzate; ritorno OSM e zoom invariato verificati.
- [x] Tasto info nel pannello destro e box «22,1 GB. Solo quel che serve.»: origine DTM (fonte Zenodo), lettura HTTP Range, piramidi assenti e zoom fisso come scelta del viewer. Screenshot desktop/mobile, apertura/chiusura Escape e ritorno focus verificati; dialogo dentro viewport e scorrevole su mobile.
- [x] Etichetta centrale in due celle uguali: separatore e metà viewport a x=720 su 1440 px, errore 0 px; screenshot `../tmp/zenodo-divider-after.png`.
- [x] Pulsante La mia posizione, permessi/errori e zoom invariato; test unitari.
- [x] OpenStreetMap a sinistra, DTM a destra, taglio fisso al centro e unico pan; attribuzione OSM visibile.
- [ ] Confermare resa raster nel browser Windows con WebGL.
- [x] Hillshade grigio, luce NO a 45°: test pendenze e compilazione espressione GLSL.
- [x] Coordinate nel frammento URL: ripristino e aggiornamento al pan verificati nel browser a 5 m/px.
- [x] Minimappa OSM fissa sull'Italia con pin del centro vista; pan principale aggiorna solo il marker. Verifica browser: `italyFixed: true`, `pinMoved: true`, nessuna interazione zoom/pan minimappa.
- [x] Clic sulla minimappa: pin e vista principale si spostano, URL aggiornato e 5 m/px invariati; verificati evento su Roma e clic reale nel browser.
- [x] Legenda rimossa, scala a destra con testo e barra chiari su fondo opaco; verificati screenshot desktop e stile calcolato `rgb(255,249,237)`.
- [x] Screenshot `../tmp/zenodo-italia-desktop.png`: Italia e pin visibili in basso a sinistra, scala 500 m leggibile a destra.
- [x] Screenshot prima/dopo: titolo ora su fondo scuro opaco ad alto contrasto; immagini in `../tmp/zenodo-title-before.png` e `../tmp/zenodo-layout-after.png`.

## 2026-11-18
- [x] Indicatore di caricamento a destra del mirino (`#dtm-loading`): «Lettura degli indici del DTM…» finché la sorgente non è pronta, poi «Caricamento del rilievo…» tra `loadstart` e `loadend` della mappa e con tasselli DTM in corso. Verificato con agent-browser (Chromium headed su Xvfb, WebGL attivo): visibile durante un pan di 4 km, nascosto al `loadend` (~3,4 s). 31 test ok.
- [x] Nota «Byte = corpi delle risposte…» tolta dal footer, ora tooltip su «Dati raster letti».
- [x] OSM fissato ai tasselli dello zoom 14 (`new OSM({maxZoom:14})`), parametro `?osm=` tolto. CARTO @2x scartato: richiede API key.
- [ ] Netlify serve una build vecchia (default Palermo `[13.35,38.12]`): ricaricare `dist` dopo `npm run build`.

## Prototipo base vettoriale (`?base=vettoriale`) - 2026-11-18
- [x] Vista EPSG:3857 solo col parametro, risoluzione 5/cos(lat) aggiornata a `moveend`: scala 500 m = 100 px come nella versione 6875 (Palermo).
- [x] Base OpenFreeMap «liberty» con `ol-mapbox-style` 13.9.0, `text-size` ×1,3 (`vectorbase.js`, test). Tolti i layer con `fill-pattern` (`landcover_wetland`, `road_area_pattern`): lo sprite «broken» bloccava il render di tutta la mappa. Sfondo `background` applicato con `layer.setBackground`.
- [x] DTM riproiettato 6875→3857 da OpenLayers 10.6.1: si vede, ma con scalettature lungo i pendii assenti nella versione attuale.
- [x] Quota: 16,2 m a 38.115/13.360 in entrambe le versioni.
- [x] Scelta OSM raster zoom 14: prototipo vettoriale rimosso (`vectorbase.js`, `ol-mapbox-style`, `?base=vettoriale`) per non riproiettare il DTM.
- Domande aperte: limiti d'uso OpenFreeMap per un sito pubblico? Pochi nomi di strade nei dati OpenMapTiles a questo zoom.

## Base nell'URL e ricerca toponimi - 2026-11-18
- [x] `&base=agea|osm` nel frammento, letto all'avvio e al cambio hash (`readBase`, test). Verificato: apertura con `base=osm` seleziona OSM, cambio radio aggiorna l'URL.
- [x] Lente «Cerca un luogo» (`search.js`, test): Nominatim, solo Italia, una richiesta all'invio, credito visibile. Desktop: riquadro a sinistra del pannello; mobile: quarto pulsante 48×48, riquadro sotto i pulsanti, nessun overflow a 390 px. Verificato «Monte Pellegrino» → 38.16611/13.35380, «Stromboli».
- [ ] Ricaricare `dist` su Netlify dopo la scelta della base.

## Pannello ridotto - 2026-11-18
- [x] Tolti stato, risposte HTTP 206, prima vista, badge zoom fisso e coordinate (restano in `window.dtm.stats` e nell'URL). Contatore «X MiB letti su 22,1 GB» nel riquadro del titolo, con la virgola decimale. Pannello desktop = icone ricerca/posizione/info + base «Ortofoto/OSM» (regole solo sopra 700 px). Verificato a 1400×900 e 390×844, 34 test ok.
- [x] Popup info: sezioni «Perché si può fare» (dato aperto, CC BY 4.0 verificata su Zenodo) e «Da provare»; nota sulle due metà affiancate corretta; tolti due trattini lunghi. Dialogo più lungo: 1160 px di contenuto su 866 visibili a 1400×900, scorre.
- [x] Popup info chiudibile anche con clic fuori dal riquadro (oltre a × ed Escape). Verificato con clic reali: dentro resta aperto, fuori si chiude, × chiude. 34 test ok.

## Cartolina 1:1 - 2026-11-18
Scelte: solo rilievo; nome del luogo solo se cercato con la lente (decade al primo spostamento); font Instrument Serif e DM Mono caricati nel sito.
- [x] Esportazione: mappa nascosta 1080×780, stessa sorgente DTM. Copia in `rendercomplete` dava fascia vuota; risolto copiando il canvas nel `postrender` del layer dopo un `map.render()`. PNG Stromboli verificato.
- [x] Composizione 1080×1080 (`snapshot.js`): header, rilievo con mirino, footer con crediti, scala 1 km, indirizzo. Verificata con e senza luogo cercato («Isola di Stromboli, Lipari»).
- [x] Font @fontsource/instrument-serif 5.2.8 e dm-mono 5.2.7, attesa `document.fonts.load`: verificati nel PNG.
- [x] Pulsante macchina fotografica (desktop e mobile, nessun overflow a 390 px), anteprima con «Scarica PNG»; «Condividi» compare solo se `navigator.canShare` accetta file (non verificabile su desktop headless).
- [x] Test `card-text.test.js`: 37 test ok.
Domande aperte: peso dei font nel bundle; condivisione file su desktop non verificabile qui

## Modalità «due mirini» - 2026-11-18
Scelte: quota sotto il mirino destro; a sinistra zoom iniziale = 5 m a terra; zoom da 5 (Italia) a 20.
- [x] Mappa sinistra separata (`dualview.js`, EPSG:3857, AGEA/OSM nativi, interazioni standard senza rotazione); mappa principale con `view.padding` sinistro = metà larghezza, centro ripristinato dopo il cambio. Verificato: centri ai pixel 350 e 1050 su 1400.
- [x] Centri sincronizzati nei due versi con guardia anti-rimbalzo: scarto 0,29 m dopo zoom+pan a sinistra, 0,50 m dopo pan a destra (riferimento: hash a 5 decimali, ~1 m).
- [x] Mirino per metà, quota sotto quello destro, indicatore di caricamento sotto la quota.
- [x] Tasto nel pannello (desktop e mobile), `&vista=doppia` nell'URL, ritorno alla vista normale verificato. Pulsanti a 320 px ridotti a 44 px senza sovrapposizioni, nessun overflow a 390 e 320 px.
- [x] 39 test ok (`readDual`, `groundResolution`).

## Limite richieste Zenodo - 2026-11-18
- [x] Buchi nel rilievo e «Un blocco del DTM non è stato caricato» in Trentino (46.53327/11.06437) dopo 26,1 MiB letti. Da sessione nuova lo stesso punto si carica intero (15 risposte, 9,9 MiB). Zenodo: `x-ratelimit-limit: 133`, `retry-after: 59`; causa probabile 429 (non provocato apposta). OpenLayers non riprova i blocchi in errore.
- [x] `createRateGate` in `config.js`: con `X-RateLimit-Remaining` ≤ 1 o HTTP 429 le richieste attendono `X-RateLimit-Reset` (+0,5 s, max 65 s) e il 429 viene ripetuto fino a 5 volte. Indicatore: «Zenodo chiede una pausa: riprendo tra N s…». Verificato nel browser che `X-RateLimit-Remaining`/`Reset` sono leggibili e `Retry-After` no. 42 test ok.
- [x] Linee dritte ai bordi dei blocchi: l'hillshade leggeva vicini assenti oltre il bordo. `GutteredGeoTIFF` (`dtm-source.js`) legge 1 px in più per lato e lo dichiara come `gutter` (OpenLayers lo gestisce nella texture); `sampleElevation` salta il margine. Verificato: linee sparite su Stromboli in mappa e in cartolina, quote invariate (841,1 m Stromboli, 16,2 m Palermo). 43 test ok. Dipende da interni di ol 10.6.1 (versione fissata).
- [x] Modalità doppia, richieste in eccesso: la destra seguiva ogni posizione intermedia del trascinamento a sinistra. Ora destra aggiornata solo a `moveend` della sinistra (soglia 0,01 m contro i rimbalzi), rotella a sinistra senza ancora (`useAnchor:false`). Misura, z12, 200 px in 40 passi: 0 richieste durante il gesto, 10 a fine gesto (salto diretto equivalente: 12); scarto tra i centri 0,01 m. Rotella: 0 richieste, centro invariato.
- [x] Pulsante «Allinea zoom» nella metà sinistra (in basso a destra, sopra i crediti AGEA): solo in modalità doppia e solo se lo zoom a sinistra differisce dai 5 m del rilievo; riporta la sinistra a 5 m con animazione. Verificato: nascosto all'attivazione, compare dopo uno zoom, al clic zoom 14,57 (allineato), 0 richieste DTM, centro invariato; a caricamento finito lo zoom a sinistra fa 0 richieste. Mobile 390 px senza overflow.
- [x] Cartolina, attesa visibile: riquadro 1:1 con riflesso animato e spinner al posto dell'immagine, contatore «N blocchi del rilievo letti…» (eventi `tileloadend` della sorgente durante la preparazione). Movimento ridotto con `prefers-reduced-motion`. Verificato a schermo.
- [x] Codice breve nella cartolina (`shortcode.js`, test): lat/lon a 0,0001° (~10 m) nel riquadro 35-48 N, 6-19 E, base 62, 6 caratteri; `/4Z4pkM` → `#lat=38.21750&lon=13.31430`. Footer cartolina e testo di condivisione usano il link breve. `public/_redirects` (`/*  /index.html  200`) per Netlify: da verificare dopo il deploy. 45 test ok.
- [x] Cartolina centrata sul centro della metà destra (pixel 0,75 × larghezza, metà altezza), non sul mirino; mirino tolto dalla cartolina; coordinate, quota e codice breve ricalcolati per quel centro. In modalità doppia coincide col mirino destro. Verificato sull'Etna: cartolina e metà destra della pagina hanno lo stesso centro.
- [x] Cambio di modalità senza spostare il rilievo: tolto il ricentramento dopo `view.padding` (il setter di OpenLayers mantiene fermo il contenuto). Il mirino destro indica il punto che era al centro della metà destra. Verificato: terreno spostato 0,000 m in entrata e in uscita, differenza pixel 0 nella metà destra, 0 richieste DTM a caricamento finito.

## Ridisegno «Il terreno, da vicino» - approvate fasi A e B il 2026-11-18, fatte il 2026-11-19
Fonte: mockup «Suggerimenti GUI e feature», file `Il terreno da vicino - Ridisegno.dc.html`. È un mock: luoghi, quote, profilo, MiB e rese del rilievo (filtri CSS su un PNG) sono finti. Implementazione in JS e CSS vanilla sull'app attuale, senza React, senza `support.js`, senza gli `assets/*.png` del mock. Si conservano: layout sotto 700 px, la mia posizione, «Allinea zoom», popup alla prima visita (testo attuale, raggiungibile da «Dietro la mappa: come funziona →»), indicatore di caricamento e pausa Zenodo, errori, clic sulla minimappa, attribuzioni OSM/AGEA, `base=` e `vista=doppia` nell'URL, link breve da `SITE`. Font self-hosted con @fontsource (Newsreader, IBM Plex Mono), non Google Fonts. Baseline: 45 test ok.

### Fase A - involucro grafico (solo aspetto, stessi comportamenti)
- [x] Palette verde scuro/oro, font, riquadro titolo «Il terreno, da vicino.» con ricerca integrata, contatore MiB, nome e coordinate del punto → verify: `npm test` verde (test di layout aggiornati), confronto a schermo 1400×900 e 390×844 su Xvfb.
- [x] Pannello destro: blocco VISTA, strumenti con tasto, BASE A SINISTRA; barra in basso con coordinate, nota zoom, scala, crediti → verify: tutti i pulsanti attuali ancora raggiungibili, nessun overflow a 390 e 320 px.
- [x] Ricerca: «Luoghi da provare» (5 luoghi fissi con coordinate verificate) e «Recenti» (ultimi 3, solo in memoria); Nominatim resta una richiesta per invio → verify: test su `search.js`, prova con Stromboli.
- [x] Scorciatoie: `/` ricerca, `1` `2` `3` viste, Maiusc+`← →` divisore, `R`, `C`, `?`, `Esc` (`P` rinviato con il profilo); pannello «Scorciatoie» → verify: test sul gestore, prova a schermo.

### Fase B - viste e luce, sul motore attuale
- [x] Tendina: divisore trascinabile (maniglia, tastiera) invece della metà fissa → verify: estensione di DTM e base segue il divisore, richieste DTM misurate a divisore al 20% e all'80%.
- [x] Affiancate = modalità due mirini attuale, con +/− e scala della sinistra; `vista=doppia` resta valido → verify: link vecchi aprono la vista giusta.
- [x] Fusione: rilievo a tutta larghezza in trasparenza sull'ortofoto, cursore di opacità → verify: misurare quanti blocchi in più legge (circa il doppio atteso) prima di tenerla.
- [x] Pannello Rilievo: azimut e altezza del sole, esagerazione verticale, resa ombreggiata/multidirezionale/pendenza (variabili di stile WebGL in `relief.js`) → verify: test su `relief.js`, cambio senza nuove richieste a Zenodo.

### Fase C - da verificare prima di promettere (non approvata, ferma)
- [ ] Profilo A→B: contare blocchi e richieste per un segmento di 3 km contro il limite di 133 al minuto; se regge, due clic A e B, grafico, salita e discesa reali.
- [x] Cartolina con scelta Rilievo/Ortofoto/Tendina e formato 4:3, 1:1, 4:5: fatta il 2026-11-19, vedi «Cartolina avanzata».

### Cartolina avanzata - richiesta 2026-11-19
Scelte: centro unico per tutte le immagini (il centro della parte di rilievo, come oggi); niente mirino; in testa il nome del luogo cercato, altrimenti il titolo; ortofoto = base scelta (AGEA o OSM); font Newsreader e IBM Plex Mono, tolti Instrument Serif e DM Mono. CORS verificato: AGEA e OSM mandano `Access-Control-Allow-Origin`.
- [x] Immagine Rilievo / Ortofoto / Tendina (metà e metà), formato 4:3, 1:1, 4:5 (1080×810, 1080×1080, 1080×1350) → verify: test su testi e misure; PNG reali per i tre casi. Esito 2026-11-19: PNG su Stromboli rilievo 4:5 1080×1350, ortofoto 1:1 1080×1080, tendina 4:3 1080×810; nessuna richiesta a Zenodo in più (blocchi in cache). Con WebGL software ogni resa del rilievo ha richiesto decine di secondi; su GPU reale non misurato.
- [x] Anteprima a sinistra, comandi a destra; «Scarica PNG», «Copia link», «Condividi» dove il browser lo consente → verify: link negli appunti, mobile a 390 px. Esito: «Link copiato ✓» compare, ma il contenuto degli appunti non l'ho potuto rileggere nel browser automatico; a 390 px una colonna, nessuno scorrimento orizzontale.
- [x] Crediti della base nel piede quando c'è l'ortofoto → verify: test (`cardCredits`, 58 test ok).

### Mobile, ritocchi - richiesta 2026-11-19
- [x] Riquadro +/− della metà sinistra nascosto sotto 700 px (pinch zoom; la scala sbordava) → verify: a 320 px compare solo «Allinea zoom» dopo uno zoom. Fatto.
- [x] Crediti in un'unica striscia in basso con la scala, attribuzioni OpenLayers nascoste su mobile → verify: testo intero a 320 px (156 px su 156 con AGEA, 138 su 138 con OSM), nessuno scorrimento orizzontale. Fatto.

### Gmaps e strumenti più compatti - richiesta 2026-11-19
- [x] Righe degli strumenti 34 px e spazio 2 px su desktop (mobile invariato, 48 px) → verify: screenshot 1400×900. Fatto.
- [x] «Gmaps» con lo stile degli altri strumenti, scorciatoia `G`, su mobile terzo pulsante a sinistra → verify: test `googleMapsUrl`; a 320 px nessuno scorrimento orizzontale. Fatto. Poi URL cambiato in `maps?q=37.75000,14.99000&t=k&z=18` per avere il pin: verificato nel browser, pin rosso, satellite, scheda del luogo con «Indicazioni». Zoom portato a 16 (circa 1,9 m/px) per tenere il contesto.

### Ripristino del rilievo - richiesta 2026-11-19
- [x] «↺ Ripristina» in alto a destra nel pannello Rilievo → verify: nel browser, spento all'inizio, acceso dopo multidirezionale 355°/10°/2,5×, al clic tutto torna a ombreggiato 315°/45°/1× e si spegne. Fatto.

### Link condivisi in Affiancate - segnalazione 2026-11-19
- [x] `#lat=45.52639&lon=9.23717&base=agea&vista=doppia` si apriva su 45.52708/9.26603: differenza di longitudine 0,02886°, un quarto di 1800 px per 5 m. Causa: `setMode` all'avvio imposta `view.padding`, che lascia fermo il terreno e sposta il centro. Correzione: dopo `setMode(initialMode)` il centro torna su `initialPosition` → verify: nel browser a 1800×920 l'hash resta identico in doppia, fusione e tendina; coordinata sotto il mirino destro uguale al centro della vista; test statico, 60 test ok. Fatto.

### Scala sinistra fuori dal riquadro - segnalazione 2026-11-19
- [x] A zoom 1,5× la barra da 500 m usciva dal riquadro di 132 px. `ScaleLine` della mappa sinistra con `minWidth:40,maxWidth:100` (spazio interno 108 px) → verify: nel browser a 1800×920, zoom da 12 a 17,5 a passi di 0,5, barra larga 42-85 px, sempre dentro; test statico, 61 test ok. Fatto.

### Nuovo file DTM, Zenodo 24009736 (v1.3) - fase 1, approvata 2026-11-19
Ispezione con gdalinfo via HTTP Range: `HRDM5m_20261030_cog.tif`, 34.305.072.863 byte, EPSG:6875, 5 m, griglia spostata di 1 px a est, blocchi 512×512, ZSTD con predictor 3, nodata NaN, 9 piramidi (10-2560 m). Range 206 e CORS `*` verificati.
- [x] Nuovo `DTM_URL` → verify: risposta 206 nel browser. Fatto: solo risposte 206.
- [x] Decoder ZSTD registrato in geotiff.js (codice 50000) con `zstddec` già installato → verify: test di decodifica in node; rilievo visibile nel browser. Fatto: in node Etna 3148,9 m, Stromboli 788,0 m, mare NaN; OpenLayers decodifica nei worker, quindi `dtm-source.js` passa `pool:null`; serve la dimensione del blocco perché i frame di GDAL non la dichiarano. Rilievo visibile su Stromboli, senza righe ai bordi.
- [x] Nodata: tolto `nodata:-9999`, si usa il NaN del file → verify: in node il mare dà NaN, che `sampleElevation` scarta già. Nel browser il mare resta grigio chiaro come col file precedente: non è un cambiamento.
- [x] Testi: 34,3 GB, link al record 24009736 (pagina, popup, cartolina, README), popup sulle piramidi (ora ci sono, lo zoom fisso resta una scelta) → verify: test aggiornati. Fatto, 61 test ok; LOG e voci passate del todo lasciate col vecchio record.
- [x] Misure: byte degli indici e di una vista con il nuovo file, cartolina → verify: nel browser. Fatto: Stromboli, indici e prima vista 4,6 MiB in 13 richieste (prima 10,6 MiB); cartolina 1080×1080 col link al record 24009736. Indici da soli non separati.
Fase 2 (zoom libero) solo dopo, su richiesta.

### Esito 2026-11-19
Verificato su Xvfb con agent-browser e SwiftShader, a 1400×900, 390×844 e 320×640.
- Fase A: riquadro del titolo con ricerca, luoghi e recenti (Matera → «Sassi di Matera, Matera», quota 392,1 m), Nominatim («Monte Pellegrino» → 3 risultati con dettaglio), `/` porta il fuoco nel campo. Scorciatoie: `/`, `1` `2` `3`, Maiusc+← →, `R`, `C`, `?`, `Esc`. `P` non c'è, il profilo è in fase C. Le frecce senza Maiusc spostano già la mappa (KeyboardPan), quindi il divisore usa Maiusc+← → o le frecce sulla maniglia. Mobile: sette pulsanti, nessuno scorrimento orizzontale a 390 e 320 px.
- Fase B: divisore al 30%, estensioni seguono. Misura su punti nuovi: rilievo al 20% dello schermo 13 richieste e 1,8 MiB; all'80% 35 richieste e 5,9 MiB. Fusione su Stromboli: blend `multiply`, opacità 0,6, `vista=fusione` nell'URL. Il confronto tendina/fusione su due punti diversi (28 richieste e 6,3 MiB contro 25 e 2,6) non è conclusivo: il peso dipende dal luogo più che dalla vista. Rilievo: pendenza, azimut 135° ed esagerazione 3×, 13 richieste prima e 13 dopo. Affiancate: + porta a zoom 2,0×, compare «Allinea zoom». Cartolina multidirezionale 1080×1080 su Monte Pellegrino.
- Bug corretto: `hashchange` spostava il centro prima di leggere la vista, e lo spostamento riscriveva l'hash con la vista vecchia. Ora legge tutti i parametri prima.
- Test: 56 ok. Build ok.
- Da ricaricare su Netlify: `dist` aggiornata, deploy non fatto.

### Domande irrisolte
- Sky-view factor e TINITALY: fuori per scelta del 2026-11-18.
- Curve di livello: nessuna risposta, non fatte.
- Anteprima social: non cambiata. La cartolina ora usa Newsreader e IBM Plex Mono, come il mockup.
- In Tendina, con il divisore molto a sinistra, l'etichetta AGEA finisce sotto il riquadro del titolo.
