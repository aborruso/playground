# LOG

## 2026-11-19

- Nuovo file DTM: Zenodo 24009736, v1.3, `HRDM5m_20261030_cog.tif`, 34,3 GB, COG con piramidi, ZSTD, nodata NaN. Decoder ZSTD con `zstddec` nel thread principale (geotiff.js 2.1.3 non lo ha), tolto `nodata:-9999`, testi e link aggiornati; zoom ancora fisso a 5 m. Stromboli: prima vista 4,6 MiB in 13 richieste (prima 10,6 MiB), quota 788,0 m come prima.

- Scala della metà sinistra (Affiancate, desktop) limitata a 100 px con `maxWidth`: a zoom 1,5× la barra da 500 m usciva dal riquadro.

- Corretto: un link con `vista=doppia` si apriva spostato di un quarto di schermo (2,25 km a 1800 px), perché l'ingresso in Affiancate lascia fermo il terreno e sposta il centro. All'apertura il centro torna sul punto condiviso.

- Pannello Rilievo: «↺ Ripristina» accanto al titolo, riporta ombreggiato, 315°, 45°, 1×; spento quando i valori sono già quelli predefiniti.

- Strumento «Gmaps» (`G`): Google Maps con pin rosso sul punto del mirino, satellite, zoom 16, in una nuova scheda (`maps?q=…&t=k&z=16`, verificato nel browser). Righe degli strumenti più compatte su desktop (34 px, prima 44).

- Ridisegno «Il terreno, da vicino» (mockup «Suggerimenti GUI e feature»), fasi A e B. Palette verde scuro e oro, font Newsreader e IBM Plex Mono da @fontsource, ricerca nel riquadro del titolo con luoghi da provare e recenti, pannello VISTA, barra in basso, scorciatoie da tastiera.
- Tre viste: Tendina con divisore trascinabile, Affiancate (ex due mirini, `vista=doppia` resta valido, ora con + e − e scala), Fusione in trasparenza (`vista=fusione`).
- Pannello Rilievo: azimut, altezza, esagerazione, resa ombreggiata, multidirezionale o pendenza, come variabili dello shader. Cambio senza richieste a Zenodo (13 prima, 13 dopo).
- Corretto: a pagina aperta, un cambio di hash con un'altra vista veniva sovrascritto dallo spostamento del centro.
- Cartolina con immagine Rilievo, Ortofoto o Tendina e formato 4:3, 1:1 o 4:5; «Copia link»; crediti della base nel piede; font Newsreader e IBM Plex Mono (tolti Instrument Serif e DM Mono).
- Mobile: tolto il riquadro +/− della metà sinistra (si ingrandisce con le dita; la scala usciva dal riquadro); crediti in un'unica striscia in basso con la scala, attribuzioni delle mappe nascoste. Verificato a 390 e 320 px.
- Lasciati fuori: sky-view factor, confronto TINITALY, profilo A→B.

## 2026-11-18

- Sorgenti spostati in `playground/zenodo-dtm-viewer/` (prima in una cartella di prove locale). Sito pubblicato su Netlify: https://dainty-kashata-4413d4.netlify.app/ (deploy manuale della `dist`).
- Indicatore di caricamento a destra del mirino; pannello ridotto a barra di icone; contatore «MiB letti su 22,1 GB» sotto il titolo.
- OSM con tasselli dello zoom 14 per etichette leggibili a 5 m/px; base vettoriale provata e scartata (richiedeva di riproiettare il DTM).
- Base e modalità nell'URL (`&base=`, `&vista=doppia`); ricerca toponimi con Nominatim.
- Modalità due mirini: metà sinistra zoomabile e sincronizzata, «Allinea zoom», cambio di modalità senza spostare il rilievo.
- Cartolina PNG 1080×1080 del rilievo, centrata sulla metà destra, con link breve a 6 caratteri (`shortcode.js`, `public/_redirects`).
- Limite richieste Zenodo (133 per finestra): attesa su `X-RateLimit-Reset` invece del 429; destra aggiornata a fine gesto nella modalità doppia.
- Linee ai bordi dei blocchi tolte con un gutter di 1 px (`dtm-source.js`).
