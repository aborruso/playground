# LOG

## 2026-11-18

- Sorgenti spostati in `playground/zenodo-dtm-viewer/` (prima in una cartella di prove locale). Sito pubblicato su Netlify: https://dainty-kashata-4413d4.netlify.app/ (deploy manuale della `dist`).
- Indicatore di caricamento a destra del mirino; pannello ridotto a barra di icone; contatore «MiB letti su 22,1 GB» sotto il titolo.
- OSM con tasselli dello zoom 14 per etichette leggibili a 5 m/px; base vettoriale provata e scartata (richiedeva di riproiettare il DTM).
- Base e modalità nell'URL (`&base=`, `&vista=doppia`); ricerca toponimi con Nominatim.
- Modalità due mirini: metà sinistra zoomabile e sincronizzata, «Allinea zoom», cambio di modalità senza spostare il rilievo.
- Cartolina PNG 1080×1080 del rilievo, centrata sulla metà destra, con link breve a 6 caratteri (`shortcode.js`, `public/_redirects`).
- Limite richieste Zenodo (133 per finestra): attesa su `X-RateLimit-Reset` invece del 429; destra aggiornata a fine gesto nella modalità doppia.
- Linee ai bordi dei blocchi tolte con un gutter di 1 px (`dtm-source.js`).
