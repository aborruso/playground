import 'ol/ol.css';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-400-italic.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {GutteredGeoTIFF} from './dtm-source.js';
import WebGLTile from 'ol/layer/WebGLTile.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import Attribution from 'ol/control/Attribution.js';
import DragPan from 'ol/interaction/DragPan.js';
import KeyboardPan from 'ol/interaction/KeyboardPan.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import {createItalyMinimap} from './minimap.js';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import {transform} from 'ol/proj.js';
import {DTM_URL,viewOptions,rangeFetch,rightHalfExtent,leftHalfExtent,clampSplit,createRateGate} from './config.js';
import {getPosition} from './location.js';
import {RELIEF_DEFAULTS,reliefStyle,reliefVariables} from './relief.js';
import {readPosition,positionHash,readBase,readMode,googleMapsUrl} from './position-url.js';
import {createDualView} from './dualview.js';
import {createAgeaLayer} from './basemaps.js';
import {showIntroOnce} from './intro.js';
import {sampleElevation,formatElevation} from './elevation.js';
import {createPlaceSearch} from './search.js';
import {renderRelief,renderBase,composeCard,SITE,CARD,HEADER,FOOTER} from './snapshot.js';
import {encodePoint,decodePoint} from './shortcode.js';
import {shortPlaceName,coordsLabel,snapshotFileName,cardImageHeight} from './card-text.js';

proj4.defs('EPSG:6875','+proj=tmerc +lat_0=0 +lon_0=12 +k=0.9985 +x_0=7000000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
register(proj4);
const start=performance.now();
let rasterTilesLoaded=0;
const stats={bytes:0,requests:0,responses:[],firstViewSeconds:null};
const el=(id)=>document.getElementById(id);
const decimal=(value,digits=1)=>value.toLocaleString('it-IT',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const nativeFetch=window.fetch.bind(window);
function showError(error) {
  el('error').textContent=error.message || String(error);
  el('dtm-loading').hidden=true;
}
const rateGate=createRateGate({onWait:(seconds)=>{
  el('dtm-loading-text').textContent='Zenodo chiede una pausa: riprendo tra '+seconds+' s…';
  el('dtm-loading').hidden=false;
}});
window.fetch=async(input,options={})=>{
  const url=typeof input==='string'?input:input.url;
  if(url!==DTM_URL) return nativeFetch(input,options);
  try {
    return await rangeFetch(input,options,nativeFetch,(entry)=>{
      stats.bytes+=entry.bytes; stats.requests++; stats.responses.push(entry);
      el('bytes').textContent=decimal(stats.bytes/1048576)+' MiB';
      el('last-read').textContent='ultimo: +'+Math.round(entry.bytes/1024).toLocaleString('it-IT')+' KB';
    },rateGate);
  } catch(error) {showError(error);throw error;}
};
const source=new GutteredGeoTIFF({
  // No nodata override: the file declares NaN, which OpenLayers handles.
  sources:[{url:DTM_URL}],
  normalize:false, interpolate:false, wrapX:false,
  sourceOptions:{allowFullFile:false,maxRanges:0,blockSize:65536,cacheSize:256}
});
// Light and rendering type: style variables, changed without new reads.
const relief={...RELIEF_DEFAULTS};
// Own class name: the relief gets its own canvas, which "fusione" blends over the base.
const layer=new WebGLTile({source,preload:0,cacheSize:128,className:'dtm-relief',style:reliefStyle(relief)});
// Short postcard links (/4Z4pkM) become the usual #lat=…&lon=… address.
const codePoint=decodePoint(window.location.pathname.slice(1));
if(codePoint) history.replaceState(null,'','/'+positionHash(codePoint));
const initialPosition=readPosition(window.location.hash) || [14.99,37.75];
const initialBase=readBase(window.location.hash);
const initialMode=readMode(window.location.hash);
const view=new View(viewOptions(transform(initialPosition,'EPSG:4326','EPSG:6875')));
// Zoom-14 tiles upscaled to 5 m/px: larger, legible labels (z15 tiles get shrunk).
const osm=new TileLayer({source:new OSM({maxZoom:14}),visible:false});
const agea=createAgeaLayer();
const map=new Map({target:'map',layers:[osm,agea,layer],view,pixelRatio:1,
  controls:[new ScaleLine({target:el('scale')}),new Attribution({collapsible:false})],interactions:[new DragPan(),new KeyboardPan()],
  maxTilesLoading:4});
const minimap=createItalyMinimap('minimap',view);
map.on('dblclick',(event)=>{
  event.preventDefault();
  view.setCenter(event.coordinate);
});
// View modes. tendina: base on the left of a movable divider, relief on the right;
// affiancate: the two-crosshair mode (left half is a separate, zoomable map);
// fusione: relief over the base, full width, in transparency.
let mode='tendina',split=0.5,fusionOpacity=0.6,baseName='agea';
const effectiveSplit=()=>mode==='affiancate'?0.5:split;
// Screen extent from the centre pixel: the screen centre, or the centre of
// the right half in "affiancate" mode (view padding = left half).
function updateSplit() {
  const size=map.getSize(), center=view.getCenter(), resolution=view.getResolution();
  if(!size || !center) return;
  const [width,height]=size, centerPixel=mode==='affiancate'?width*0.75:width/2;
  const x=(pixel)=>center[0]+(pixel-centerPixel)*resolution;
  const extent=[x(0),center[1]-height/2*resolution,x(width),center[1]+height/2*resolution];
  const ratio=effectiveSplit();
  const fused=mode==='fusione';
  layer.setExtent(fused?undefined:rightHalfExtent(extent,ratio));
  osm.setExtent(fused?undefined:leftHalfExtent(extent,ratio));
  agea.setExtent(fused?undefined:leftHalfExtent(extent,ratio));
  document.body.style.setProperty('--split',(ratio*100).toFixed(2)+'%');
}
view.on('change:center',updateSplit);
map.on('change:size',updateSplit);
updateSplit();
// Pixel shown by the relief: the centre of its part of the screen (postcard centre).
function reliefCenterPixel() {
  const [width,height]=map.getSize();
  if(mode==='fusione') return [width/2,height/2];
  return [width*(effectiveSplit()+1)/2,height/2];
}
let elevationTimer;
let elevationRequest=0;
function queueElevation() {
  const request=++elevationRequest;
  clearTimeout(elevationTimer);
  el('center-elevation').textContent='Lettura quota…';
  elevationTimer=setTimeout(async()=>{
    if(source.getState()!=='ready') return;
    const center=view.getCenter().slice();
    try {
      const value=await sampleElevation(source,center);
      if(request===elevationRequest) el('center-elevation').textContent=formatElevation(value);
    } catch {
      if(request===elevationRequest) el('center-elevation').textContent='Quota non disponibile';
    }
  },180);
}
view.on('change:center',queueElevation);
source.getView().then(queueElevation).catch(()=>{
  el('center-elevation').textContent='Quota non disponibile';
});
queueElevation();
source.on('error',()=>showError(source.getError() || new Error('Errore GeoTIFF')));
// Loading indicator next to the crosshair: index read first, then the blocks of each view.
let pendingTiles=0,mapLoading=false;
function updateLoading() {
  const ready=source.getState()==='ready';
  el('dtm-loading-text').textContent=ready?'Caricamento del rilievo…':'Lettura degli indici del DTM…';
  el('dtm-loading').hidden=Boolean(el('error').textContent) || (ready && !mapLoading && pendingTiles===0);
}
source.on('change',updateLoading);
source.on('tileloadstart',()=>{pendingTiles++;updateLoading();});
source.on(['tileloadend','tileloaderror'],()=>{pendingTiles=Math.max(0,pendingTiles-1);updateLoading();});
map.on('loadstart',()=>{mapLoading=true;updateLoading();});
map.on('loadend',()=>{mapLoading=false;pendingTiles=0;updateLoading();});
source.on('tileloadend',()=>{rasterTilesLoaded++;});
source.on('tileloaderror',()=>showError(new Error('Un blocco del DTM non è stato caricato; controllare rete e limite richieste Zenodo.')));
map.on('rendercomplete',()=>{
  if(el('error').textContent || !rasterTilesLoaded) return;
  if(stats.firstViewSeconds===null) {
    stats.firstViewSeconds=(performance.now()-start)/1000;
  }
});
// The searched place name labels the title card and the postcard until the map moves.
let lastPlace=null,picking=false,snapshotUrl=null;
function updatePlace() {
  const lonLat=transform(view.getCenter(),'EPSG:6875','EPSG:4326');
  el('place-coords').textContent=coordsLabel(lonLat);
  el('place-name').textContent=lastPlace||'';
  el('place-name').hidden=!lastPlace;
}
view.on('change:center',()=>{if(!picking) lastPlace=null; updatePlace();});
updatePlace();
function syncPosition() {
  const [lon,lat]=transform(view.getCenter(),'EPSG:6875','EPSG:4326');
  history.replaceState(null,'',window.location.pathname+window.location.search+positionHash([lon,lat],baseName,mode));
}
view.on('change:center',syncPosition);
syncPosition();
// Read every parameter first: moving the view rewrites the hash.
window.addEventListener('hashchange',()=>{
  const hash=window.location.hash;
  const coordinates=readPosition(hash), base=readBase(hash), next=readMode(hash);
  if(next!==mode) setMode(next);
  if(base) setBasemap(base);
  if(coordinates) view.setCenter(transform(coordinates,'EPSG:4326','EPSG:6875'));
});
el('locate').addEventListener('click',async()=>{
  const button=el('locate');
  button.disabled=true;
  el('location-status').textContent='Ricerca della posizione…';
  try {
    const coordinates=await getPosition();
    view.setCenter(transform(coordinates,'EPSG:4326','EPSG:6875'));
    el('location-status').textContent='Mappa centrata. Zoom invariato.';
  } catch(error) {
    el('location-status').textContent=error.message;
  } finally {button.disabled=false;}
});
const dualView=createDualView({target:'left-map',mainView:view,mainProjection:'EPSG:6875',scaleTarget:el('left-scale')});
function applyBaseVisibility() {
  const dual=mode==='affiancate';
  osm.setVisible(!dual && baseName==='osm');
  agea.setVisible(!dual && baseName==='agea');
  dualView.osm.setVisible(baseName==='osm');
  dualView.agea.setVisible(baseName==='agea');
}
const MODES=['tendina','affiancate','fusione'];
const MODE_NOTE={tendina:'Zoom fisso · 5 m/px',affiancate:'Sinistra: zoom libero · destra: 5 m/px',fusione:'Zoom fisso · 5 m/px'};
function setMode(next) {
  if(!MODES.includes(next)) return;
  const wasDual=mode==='affiancate';
  mode=next;
  const dual=mode==='affiancate';
  for(const name of MODES) document.body.classList.toggle(name,name===mode);
  document.body.classList.toggle('dual',dual);
  el('left-map').hidden=!dual;
  if(dual!==wasDual) {
    // The padding setter keeps the visible terrain still: the DTM does not move,
    // the new right crosshair marks what was already at the centre of the right half.
    const width=map.getSize()?.[0] || window.innerWidth;
    view.padding=dual?[0,0,0,width/2]:[0,0,0,0];
    if(dual) dualView.activate();
  }
  layer.setOpacity(mode==='fusione'?fusionOpacity:1);
  applyBaseVisibility();
  document.querySelectorAll('#mode-choice [data-mode]').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
  });
  el('fusion-opacity-label').hidden=mode!=='fusione';
  el('mode-cycle').setAttribute('aria-label','Vista: '+mode+'. Tocca per cambiare');
  el('zoom-note').textContent=MODE_NOTE[mode];
  updateLeftZoom();
  updateSplit();
  syncPosition();
}
map.on('change:size',()=>{
  if(mode!=='affiancate' || !map.getSize()) return;
  const center=view.getCenter().slice();
  view.padding=[0,0,0,map.getSize()[0]/2];
  view.setCenter(center);
});
document.querySelectorAll('#mode-choice [data-mode]').forEach(button=>{
  button.addEventListener('click',()=>setMode(button.dataset.mode));
});
el('mode-cycle').addEventListener('click',()=>setMode(MODES[(MODES.indexOf(mode)+1)%MODES.length]));
el('fusion-opacity').addEventListener('input',(event)=>{
  fusionOpacity=Number(event.target.value)/100;
  el('fusion-value').textContent=event.target.value;
  if(mode==='fusione') layer.setOpacity(fusionOpacity);
});
// "Affiancate": +/- and magnification of the left side; "Allinea zoom" only
// when the left zoom differs from the 5 m of the relief.
function updateLeftZoom() {
  const dual=mode==='affiancate';
  el('left-zoom').hidden=!dual;
  el('align-zoom').hidden=!dual || dualView.isAligned();
  if(dual) el('left-zoom-factor').textContent='zoom '+decimal(dualView.zoomFactor(),dualView.zoomFactor()<1?2:1)+'×';
}
dualView.map.on('moveend',updateLeftZoom);
el('align-zoom').addEventListener('click',()=>dualView.alignZoom());
el('left-zoom-in').addEventListener('click',()=>dualView.zoomBy(1));
el('left-zoom-out').addEventListener('click',()=>dualView.zoomBy(-1));
// Divider of the "tendina": drag the handle, or arrow keys on it.
function setSplit(value) {
  split=clampSplit(value);
  const percent=Math.round(split*100);
  el('split-handle').setAttribute('aria-valuenow',String(percent));
  el('split-handle').setAttribute('aria-valuetext',percent+'%');
  updateSplit();
}
const handle=el('split-handle');
handle.addEventListener('pointerdown',(event)=>{
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);
  handle.classList.add('dragging');
});
handle.addEventListener('pointermove',(event)=>{
  if(!handle.hasPointerCapture(event.pointerId)) return;
  const box=el('map').getBoundingClientRect();
  setSplit((event.clientX-box.left)/box.width);
});
handle.addEventListener('lostpointercapture',()=>handle.classList.remove('dragging'));
handle.addEventListener('keydown',(event)=>{
  const step={ArrowLeft:-0.02,ArrowRight:0.02}[event.key];
  if(step===undefined) return;
  event.preventDefault(); event.stopPropagation();
  setSplit(split+step);
});
function setBasemap(name) {
  const useAgea=name==='agea';
  baseName=useAgea?'agea':'osm';
  applyBaseVisibility();
  el('base-label').textContent=useAgea?'AGEA':'OSM';
  el('fusion-base').textContent=useAgea?'AGEA':'OSM';
  // Base credit in the bottom strip: on phones it replaces the map attribution.
  // DTM and AGEA share CC BY 4.0, so one licence link covers both; OSM is ODbL.
  el('base-credit').textContent=useAgea?' · © AGEA · ':' ';
  el('base-credit-after').textContent=useAgea?'':' · © OSM';
  el('base-name').textContent=useAgea?'Ortofoto AGEA':'OpenStreetMap';
  el('base-name').title=useAgea?'© AGEA — Agenzia per le Erogazioni in Agricoltura. Ortofoto dei voli 2022, 2023 e 2024. Licenza CC BY 4.0.':'© OpenStreetMap contributors · ODbL';
  document.querySelectorAll('input[name="basemap"]').forEach(input=>{input.checked=input.value===name;});
  el('basemap-toggle').setAttribute('aria-pressed',String(useAgea));
  el('basemap-toggle').setAttribute('aria-label',useAgea?'Attiva OpenStreetMap':'Attiva ortofoto AGEA');
  syncPosition();
}
document.querySelectorAll('input[name="basemap"]').forEach(input=>{
  input.addEventListener('change',()=>setBasemap(input.value));
});
el('basemap-toggle').addEventListener('click',()=>setBasemap(baseName==='agea'?'osm':'agea'));
setBasemap(initialBase || 'agea');
setMode(initialMode);
// Entering a mode keeps the terrain still and moves the centre (wanted for the
// button). A shared link must instead put its point under that mode's crosshair.
view.setCenter(transform(initialPosition,'EPSG:4326','EPSG:6875'));
// Side panels (relief, help): one open at a time.
const PANELS={relief:['relief-panel','relief-open'],help:['help-panel','help-open']};
function togglePanel(name,open) {
  for(const [key,[panelId,buttonId]] of Object.entries(PANELS)) {
    const show=key===name && (open ?? el(panelId).hidden);
    el(panelId).hidden=!show;
    el(buttonId).setAttribute('aria-expanded',String(show));
  }
}
el('relief-open').addEventListener('click',()=>togglePanel('relief'));
// Google Maps, satellite view, on the crosshair point (the coordinates in the URL).
function openGoogleMaps() {
  const [lon,lat]=transform(view.getCenter(),'EPSG:6875','EPSG:4326');
  window.open(googleMapsUrl([lon,lat]),'_blank','noopener');
}
el('gmaps-open').addEventListener('click',openGoogleMaps);
el('help-open').addEventListener('click',()=>togglePanel('help'));
// Relief panel: every change only updates shader variables.
function updateRelief() {
  relief.render=document.querySelector('input[name="render"]:checked').value;
  relief.azimuth=Number(el('azimuth').value);
  relief.altitude=Number(el('altitude').value);
  relief.exag=Number(el('exag').value);
  el('azimuth-value').textContent=relief.azimuth+'°';
  el('altitude-value').textContent=relief.altitude+'°';
  el('exag-value').textContent=decimal(relief.exag)+'×';
  // Slope does not depend on light or exaggeration.
  el('light-controls').disabled=relief.render==='pendenza';
  layer.updateStyleVariables(reliefVariables(relief));
  el('relief-reset').disabled=Object.keys(RELIEF_DEFAULTS).every(key=>relief[key]===RELIEF_DEFAULTS[key]);
}
el('relief-panel').addEventListener('input',updateRelief);
// Back to the default relief: one sun from the north-west, no exaggeration.
el('relief-reset').addEventListener('click',()=>{
  document.querySelector('input[name="render"][value="'+RELIEF_DEFAULTS.render+'"]').checked=true;
  el('azimuth').value=RELIEF_DEFAULTS.azimuth;
  el('altitude').value=RELIEF_DEFAULTS.altitude;
  el('exag').value=RELIEF_DEFAULTS.exag;
  updateRelief();
});
el('info-open').addEventListener('click',()=>el('info-dialog').showModal());
el('help-info').addEventListener('click',()=>{togglePanel(null);el('info-dialog').showModal();});
// Click on the backdrop (outside the dialog box) closes it.
function closeOnBackdrop(dialog) {
  dialog.addEventListener('click',(event)=>{
    const box=dialog.getBoundingClientRect();
    const inside=event.clientX>=box.left && event.clientX<=box.right && event.clientY>=box.top && event.clientY<=box.bottom;
    if(!inside) dialog.close();
  });
}
closeOnBackdrop(el('info-dialog'));
closeOnBackdrop(el('snapshot-dialog'));
const search=createPlaceSearch({button:el('search-open'),form:el('search-form'),input:el('search-input'),
  list:el('search-results'),status:el('search-status'),suggest:el('search-suggest'),
  onPick:(coordinates,name)=>{
    picking=true;
    lastPlace=shortPlaceName(name);
    view.setCenter(transform(coordinates,'EPSG:4326','EPSG:6875'));
    picking=false;
    updatePlace();
  }});
// Keyboard shortcuts (not while typing, not with Ctrl/Alt/Cmd, not over a dialog).
document.addEventListener('keydown',(event)=>{
  if(event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
  if(event.key==='Escape') {togglePanel(null); return;}
  if(event.target.closest?.('input,textarea,select')) return;
  if(event.shiftKey && (event.key==='ArrowLeft' || event.key==='ArrowRight')) {
    if(mode!=='tendina') return;
    event.preventDefault();
    setSplit(split+(event.key==='ArrowLeft'?-0.05:0.05));
    return;
  }
  const action={'/':()=>search.focus(),'r':()=>togglePanel('relief'),'c':()=>el('snapshot-open').click(),'g':openGoogleMaps,
    '?':()=>togglePanel('help'),'1':()=>setMode('tendina'),'2':()=>setMode('affiancate'),'3':()=>setMode('fusione')}[event.key.toLowerCase()];
  if(!action) return;
  event.preventDefault();
  action();
});
// Postcard: image (relief, base, half and half) and format chosen in the dialog.
// Each opening fixes one point; rendered images are reused while it stays open.
let card=null,cardImage='rilievo',cardFormat='1:1',cardRun=0;
function setPressed(selector,attribute,value) {
  document.querySelectorAll(selector).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[attribute]===value)));
}
async function renderCard() {
  const run=++cardRun, img=el('snapshot-img'), status=el('snapshot-status'), wait=el('snapshot-wait');
  const height=cardImageHeight(cardFormat), base=baseName;
  wait.style.aspectRatio=CARD+' / '+(height+HEADER+FOOTER);
  img.hidden=true; wait.hidden=false;
  el('snapshot-download').setAttribute('aria-disabled','true');
  status.textContent='Preparazione della cartolina…';
  // Live counter, so a slow read looks like work in progress, not a freeze.
  let blocks=0;
  const onBlock=()=>{blocks++; status.textContent='Preparazione della cartolina: '+blocks+(blocks===1?' blocco':' blocchi')+' del rilievo letti…';};
  source.on('tileloadend',onBlock);
  try {
    const cardView=()=>new View(viewOptions(card.center));
    const cached=(key,make)=>card.images[key] ??= make().catch(error=>{delete card.images[key]; throw error;});
    const needRelief=cardImage!=='orto', needBase=cardImage!=='rilievo';
    const styleKey=JSON.stringify(relief);
    const [reliefCanvas,baseCanvas,elevation]=await Promise.all([
      needRelief?cached('relief'+height+styleKey,()=>renderRelief({source,style:reliefStyle(relief),view:cardView(),height})):null,
      needBase?cached(base+height,()=>renderBase({layers:[base==='osm'?new TileLayer({source:new OSM({maxZoom:14})}):createAgeaLayer()],view:cardView(),height})):null,
      card.elevation
    ]);
    const canvas=await composeCard({image:cardImage,relief:reliefCanvas,base:baseCanvas,baseName:base,height,
      placeName:card.place,coords:coordsLabel(card.lonLat),link:card.link,
      elevation:elevation===null?null:formatElevation(elevation).replace(':','')});
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(run!==cardRun) return;
    const file=new File([blob],snapshotFileName(card.lonLat),{type:'image/png'});
    if(snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    snapshotUrl=URL.createObjectURL(blob);
    img.src=snapshotUrl; img.hidden=false;
    el('snapshot-download').href=snapshotUrl;
    el('snapshot-download').download=file.name;
    el('snapshot-download').removeAttribute('aria-disabled');
    const share=el('snapshot-share');
    share.hidden=!navigator.canShare?.({files:[file]});
    share.onclick=()=>navigator.share({files:[file],title:'Il terreno, da vicino',text:'https://'+card.link}).catch(()=>{});
    status.textContent='';
  } catch(error) {
    if(run===cardRun) status.textContent='Cartolina non riuscita: '+(error.message||error);
  } finally {
    source.un('tileloadend',onBlock);
    if(run===cardRun) wait.hidden=true;
  }
}
el('snapshot-dialog').addEventListener('close',()=>{
  cardRun++;
  if(snapshotUrl) URL.revokeObjectURL(snapshotUrl);
  snapshotUrl=null; card=null;
});
document.querySelectorAll('#snapshot-image [data-image]').forEach(button=>button.addEventListener('click',()=>{
  cardImage=button.dataset.image; setPressed('#snapshot-image [data-image]','image',cardImage); renderCard();
}));
document.querySelectorAll('#snapshot-format [data-format]').forEach(button=>button.addEventListener('click',()=>{
  cardFormat=button.dataset.format; setPressed('#snapshot-format [data-format]','format',cardFormat); renderCard();
}));
el('snapshot-download').addEventListener('click',(event)=>{
  if(el('snapshot-download').hasAttribute('aria-disabled')) event.preventDefault();
});
el('snapshot-copy').addEventListener('click',async()=>{
  const button=el('snapshot-copy');
  try {
    await navigator.clipboard.writeText('https://'+card.link);
    button.textContent='Link copiato ✓';
  } catch {
    button.textContent='Copia non riuscita';
  }
  setTimeout(()=>{button.textContent='Copia link';},1600);
});
el('snapshot-open').addEventListener('click',()=>{
  // Centre of the relief part of the screen, not the crosshair:
  // in the "tendina" view the crosshair can sit on the base side.
  const center=map.getCoordinateFromPixel(reliefCenterPixel());
  const lonLat=transform(center,'EPSG:6875','EPSG:4326');
  const code=encodePoint(lonLat);
  card={center,lonLat,place:lastPlace,link:code?SITE+'/'+code:SITE,images:{},
    elevation:sampleElevation(source,center).catch(()=>null)};
  el('snapshot-base').textContent=baseName==='osm'?'OSM':'Ortofoto';
  el('snapshot-dialog').showModal();
  renderCard();
});
showIntroOnce(el('info-dialog'));
// Read-only diagnostics for reproducible browser verification.
window.dtm={map,view,source,stats,minimap,osm,agea,dualView,layer,relief,setMode,setSplit,tilesLoaded:()=>rasterTilesLoaded};
if(!document.createElement('canvas').getContext('webgl')) {
  showError(new Error('WebGL non disponibile: il DTM richiede accelerazione grafica nel browser. La sola base OSM non indica che il terreno sia caricato.'));
}
