# DTM Zenodo — confronto diretto

Avvio:

```bash
npm install
npm run dev -- --port 5178
```

Aprire http://localhost:5178. La vista iniziale è sui crateri sommitali dell'Etna (37.75 N, 14.99 E); le coordinate nell'URL, se presenti, hanno la precedenza. Ortofoto AGEA a sinistra come default, DTM a destra, separatore fisso. Il pan è unico; un doppio clic centra il punto selezionato senza zoom. La risoluzione resta 5 m per pixel CSS, anche dopo La mia posizione (richiede permesso e HTTPS o localhost). Il CRS nativo è EPSG:6875. Il raster usa WebGL; non c'è proxy.

Il riquadro del titolo mostra «X MiB letti su 22,1 GB»: solo i corpi delle risposte raster 206, inclusi gli indici TIFF, non OSM o overhead HTTP. Risposte, tempi e byte restano in `window.dtm.stats`. A destra del mirino un indicatore mostra «Lettura degli indici del DTM…» e poi «Caricamento del rilievo…» finché la mappa non ha finito di caricare. I circa 9 MB degli indici sono necessari anche per una vista piccola. Nessuna promessa di caricamento istantaneo. Zenodo concede circa 133 richieste per finestra di un minuto a visitatore: quando `X-RateLimit-Remaining` scende a 1, o arriva un 429, le richieste attendono `X-RateLimit-Reset` (massimo 65 s) e ripartono, con un avviso nell'indicatore di caricamento. `Retry-After` non è esposto da CORS. Le risposte non parziali sono rifiutate prima di leggerne il corpo.

Hillshade in grigio, luce da nord-ovest a 45°, calcolato nel browser. Ogni blocco viene letto con 1 pixel in più per lato (`dtm-source.js`, `gutter` di OpenLayers), così le pendenze sui bordi dei blocchi usano i vicini veri e non compaiono linee. Minimappa OSM in basso a sinistra, fissa sull'Italia intera e con pin che segue il centro della vista; nessuno zoom o pan nella minimappa. Un clic sull'Italia sposta pin e centro della mappa principale, aggiornando l'URL senza cambiare zoom. Scala a destra, testo e barra chiari su fondo opaco; legenda rimossa. Il titolo ha un fondo opaco per restare leggibile sulla cartografia.

Un mirino indica il centro esatto della vista; sotto compare la quota del pixel originale del DTM in metri (una cifra decimale). La lettura usa i blocchi numerici del GeoTIFF, non il colore del hillshade, e richiede soltanto il tassello necessario. Si aggiorna dopo il pan, il doppio clic, la minimappa o la geolocalizzazione: durante la lettura non resta la vecchia quota. Fuori copertura o sui pixel nodata mostra Nessun dato. Le etichette AGEA/RILIEVO sono in alto per lasciare libero il centro.

L'URL conserva il centro e la base con `#lat=38.12000&lon=13.35000&base=agea` (`base=osm` per OpenStreetMap). Si aggiorna al pan senza aggiungere voci alla cronologia; aprire lo stesso link ripristina la posizione. Per condividerlo fuori dalla propria macchina occorre ospitare l'app su un indirizzo pubblico: localhost non è raggiungibile da altri.

Il tasto ⓘ Come funziona questa mappa? nel pannello destro apre un box informativo: origine e risoluzione del DTM, file da 22,1 GB, lettura parziale HTTP Range e motivo dello zoom fisso. Testo basato sulla scheda Zenodo e sulla validazione del file. Dialogo chiudibile con × o Escape e scorrevole su mobile. Si apre automaticamente alla prima visita: `localStorage` salva `zenodo-dtm:intro-seen=1` sul browser, senza cookie o tracciamento; il tasto info continua ad aprirlo manualmente. Cancellando i dati del sito (o cambiando browser/origine) ricompare. Se lo storage è bloccato, si apre a ogni visita. Nel popup sono riportati anche i crediti AGEA, le tre annate e il link alla licenza CC BY 4.0.

## Basi e vista mobile

Su desktop il pannello in alto a destra ha cinque icone (cerca un luogo, cartolina, due mirini, la mia posizione, informazioni) e i radio button Ortofoto/OSM. La lente apre una ricerca Nominatim limitata all'Italia, una richiesta per invio, con credito visibile. OSM usa i tasselli dello zoom 14 ingranditi, per avere etichette leggibili a 5 m/px; una base vettoriale è stata provata e scartata perché richiedeva di riproiettare il DTM. La base AGEA sovrappone dal basso le annate 2022, 2023 e 2024: tre WMTS distinti, non un servizio unico. Identificatori verificati con openrndt: `AgEA_Ortofoto_AgEA_2022`, `AgEA_Ortofoto_AgEA_2023`, `AgEA_Ortofoto_AgEA_2024`, EPSG:3857, tile GoogleMapsCompatible. Fonte: https://geoportale.agea.gov.it/image/rest/services/AgEA, CC BY 4.0. Non vengono selezionate coperture o analizzate trasparenze.

Sotto 700 px: mappa fullscreen, nessun pannello di statistiche/titolo/minimappa/footer. Sei pulsanti 48×48 (44 sotto 360 px): cambio base a sinistra; ricerca, cartolina, due mirini, posizione e info a destra. Scala e attribuzioni restano visibili, gli errori non sono nascosti. Il box info diventa fullscreen con chiusura sempre raggiungibile anche durante lo scroll.

## Cartolina e due mirini

La macchina fotografica crea una cartolina PNG 1080×1080 del solo rilievo (`snapshot.js`), centrata sul centro della metà destra, cioè su quello che mostra il pannello del rilievo, senza mirino: una mappa nascosta 1080×780 sulla stessa sorgente, canvas WebGL copiato nel `postrender` del layer. Header con titolo, luogo (solo se appena cercato con la lente), coordinate e quota del centro della cartolina; footer con crediti DTM CC BY 4.0, scala 1 km e indirizzo del sito. Font Instrument Serif e DM Mono da @fontsource. Anteprima con «Scarica PNG» e, dove il browser condivide file, «Condividi». Durante la preparazione un riquadro animato e un contatore dei blocchi letti mostrano l'avanzamento. Il footer della cartolina porta un link breve, `dainty-kashata-4413d4.netlify.app/4Z4pkM`: 6 caratteri in base 62 che codificano lat/lon a 0,0001° (circa 10 m) dentro 35-48 N, 6-19 E (`shortcode.js`), senza server né database. All'apertura il codice diventa il solito `#lat=…&lon=…`; su Netlify lo rende possibile `public/_redirects`.

Il tasto dei due mirini (`&vista=doppia` nell'URL) mette a sinistra una mappa separata in EPSG:3857, con zoom libero da 5 a 20, e centra il DTM nella metà destra tramite `view.padding`. Il cambio di modalità non sposta il rilievo: il mirino destro indica il punto che era già al centro della metà destra. I due centri sono sincronizzati: la sinistra segue la destra in tempo reale, la destra segue la sinistra solo a fine gesto (`moveend`), per non chiedere a Zenodo i blocchi di ogni posizione intermedia. La rotella a sinistra ingrandisce attorno al mirino, quindi lo zoom non sposta il DTM. Quando lo zoom a sinistra è diverso da quello del rilievo compare «Allinea zoom», che riporta la sinistra a 5 m. La quota resta sotto il mirino destro.

## Anteprime social

URL pubblico: https://dainty-kashata-4413d4.netlify.app/. Metadati Open Graph e Twitter Card sono statici nell'HTML, con immagine PNG `public/og-image.png` (1200×630), descrizione, testo alternativo e link assoluti. Vite copia l'immagine in `dist/og-image.png`. Dopo una modifica, eseguire la build e caricare la cartella `dist` nei Deploys dello stesso progetto Netlify; l'URL resta invariato. I social possono conservare la vecchia anteprima in cache.

Verifiche: `npm test` (45 test), `npm run build`. Prova con WebGL in agent-browser: Chromium con finestra su Xvfb (`Xvfb :97`, `DISPLAY=:97 agent-browser --headed`); headless non ha WebGL. Il tempo della prima vista è riportato solo dopo aver caricato almeno un tassello raster.

DTM: Panza et al., https://zenodo.org/records/18921767, CC BY 4.0. Basi: © OpenStreetMap contributors; © AGEA, CC BY 4.0.
