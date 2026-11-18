import 'ol/ol.css';
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
import {DTM_URL,viewOptions,rangeFetch,rightHalfExtent,leftHalfExtent,createRateGate} from './config.js';
import {getPosition} from './location.js';
import {hillshadeColor} from './relief.js';
import {readPosition,positionHash,readBase,readDual} from './position-url.js';
import {createDualView} from './dualview.js';
import {createAgeaLayer} from './basemaps.js';
import {showIntroOnce} from './intro.js';
import {sampleElevation,formatElevation} from './elevation.js';
import {createPlaceSearch} from './search.js';
import {renderRelief,composeCard,SITE} from './snapshot.js';
import {encodePoint,decodePoint} from './shortcode.js';
import {shortPlaceName,coordsLabel,snapshotFileName} from './card-text.js';

proj4.defs('EPSG:6875','+proj=tmerc +lat_0=0 +lon_0=12 +k=0.9985 +x_0=7000000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
register(proj4);
const start=performance.now();
let rasterTilesLoaded=0;
const stats={bytes:0,requests:0,responses:[],firstViewSeconds:null};
const el=(id)=>document.getElementById(id);
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
      el('bytes').textContent=(stats.bytes/1048576).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+' MiB';
    },rateGate);
  } catch(error) {showError(error);throw error;}
};
const source=new GutteredGeoTIFF({
  sources:[{url:DTM_URL,nodata:-9999}],
  normalize:false, interpolate:false, wrapX:false,
  sourceOptions:{allowFullFile:false,maxRanges:0,blockSize:65536,cacheSize:256}
});
const layer=new WebGLTile({source,preload:0,cacheSize:128,style:{color:hillshadeColor()}});
// Short postcard links (/4Z4pkM) become the usual #lat=…&lon=… address.
const codePoint=decodePoint(window.location.pathname.slice(1));
if(codePoint) history.replaceState(null,'','/'+positionHash(codePoint));
const initialPosition=readPosition(window.location.hash) || [14.99,37.75];
const initialBase=readBase(window.location.hash);
const initialDual=readDual(window.location.hash);
const view=new View(viewOptions(transform(initialPosition,'EPSG:4326','EPSG:6875')));
// Zoom-14 tiles upscaled to 5 m/px: larger, legible labels (z15 tiles get shrunk).
const osm=new TileLayer({source:new OSM({maxZoom:14}),visible:false});
const agea=createAgeaLayer();
const map=new Map({target:'map',layers:[osm,agea,layer],view,pixelRatio:1,
  controls:[new ScaleLine(),new Attribution({collapsible:false})],interactions:[new DragPan(),new KeyboardPan()],
  maxTilesLoading:4});
const minimap=createItalyMinimap('minimap',view);
map.on('dblclick',(event)=>{
  event.preventDefault();
  view.setCenter(event.coordinate);
});
// Screen extent from the centre pixel: the screen centre, or the centre of
// the right half in "two crosshairs" mode (view padding = left half).
let dual=false,baseName='agea';
function updateSplit() {
  const size=map.getSize(), center=view.getCenter(), resolution=view.getResolution();
  if(!size || !center) return;
  const [width,height]=size, centerPixel=dual?width*0.75:width/2;
  const x=(pixel)=>center[0]+(pixel-centerPixel)*resolution;
  const extent=[x(0),center[1]-height/2*resolution,x(width),center[1]+height/2*resolution];
  layer.setExtent(rightHalfExtent(extent));
  osm.setExtent(leftHalfExtent(extent));
  agea.setExtent(leftHalfExtent(extent));
}
view.on('change:center',updateSplit);
map.on('change:size',updateSplit);
updateSplit();
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
// Right-side loading indicator: index read first, then the blocks of each view.
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
function syncPosition() {
  const [lon,lat]=transform(view.getCenter(),'EPSG:6875','EPSG:4326');
  history.replaceState(null,'',window.location.pathname+window.location.search+positionHash([lon,lat],baseName,dual));
}
view.on('change:center',syncPosition);
syncPosition();
window.addEventListener('hashchange',()=>{
  const coordinates=readPosition(window.location.hash);
  if(coordinates) view.setCenter(transform(coordinates,'EPSG:4326','EPSG:6875'));
  const base=readBase(window.location.hash);
  if(base) setBasemap(base);
  if(readDual(window.location.hash)!==dual) setDual(!dual);
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
const dualView=createDualView({target:'left-map',mainView:view,mainProjection:'EPSG:6875'});
function applyBaseVisibility() {
  osm.setVisible(!dual && baseName==='osm');
  agea.setVisible(!dual && baseName==='agea');
  dualView.osm.setVisible(baseName==='osm');
  dualView.agea.setVisible(baseName==='agea');
}
function setDual(on) {
  dual=on;
  document.body.classList.toggle('dual',on);
  el('left-map').hidden=!on;
  // The padding setter keeps the visible terrain still: the DTM does not move,
  // the new right crosshair marks what was already at the centre of the right half.
  const width=map.getSize()?.[0] || window.innerWidth;
  view.padding=on?[0,0,0,width/2]:[0,0,0,0];
  if(on) dualView.activate();
  applyBaseVisibility();
  el('dual-toggle').setAttribute('aria-pressed',String(on));
  updateAlignButton();
  updateSplit();
  syncPosition();
}
map.on('change:size',()=>{
  if(!dual || !map.getSize()) return;
  const center=view.getCenter().slice();
  view.padding=[0,0,0,map.getSize()[0]/2];
  view.setCenter(center);
});
el('dual-toggle').addEventListener('click',()=>setDual(!dual));
// "Allinea zoom": shown in dual mode only when the left zoom differs from the DTM.
function updateAlignButton() {el('align-zoom').hidden=!dual || dualView.isAligned();}
dualView.map.on('moveend',updateAlignButton);
el('align-zoom').addEventListener('click',()=>dualView.alignZoom());
function setBasemap(name) {
  const useAgea=name==='agea';
  baseName=useAgea?'agea':'osm';
  applyBaseVisibility();
  el('base-label').textContent=useAgea?'AGEA':'OSM';
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
if(initialDual) setDual(true);
el('info-open').addEventListener('click',()=>el('info-dialog').showModal());
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
createPlaceSearch({button:el('search-open'),form:el('search-form'),input:el('search-input'),
  list:el('search-results'),status:el('search-status'),
  onPick:(coordinates,name)=>{
    picking=true;
    view.setCenter(transform(coordinates,'EPSG:4326','EPSG:6875'));
    picking=false;
    lastPlace=shortPlaceName(name);
  }});
// The searched place name labels the postcard only until the map moves.
let lastPlace=null,picking=false,snapshotUrl=null;
view.on('change:center',()=>{if(!picking) lastPlace=null;});
el('snapshot-dialog').addEventListener('close',()=>{
  if(snapshotUrl) URL.revokeObjectURL(snapshotUrl);
  snapshotUrl=null;
});
el('snapshot-open').addEventListener('click',async()=>{
  const img=el('snapshot-img'),actions=el('snapshot-actions'),share=el('snapshot-share'),status=el('snapshot-status');
  img.hidden=true; actions.hidden=true; el('snapshot-wait').hidden=false;
  status.textContent='Preparazione della cartolina: lettura dei blocchi del rilievo…';
  el('snapshot-dialog').showModal();
  // Live counter, so a slow read looks like work in progress, not a freeze.
  let blocks=0;
  const onBlock=()=>{blocks++; status.textContent='Preparazione della cartolina: '+blocks+(blocks===1?' blocco':' blocchi')+' del rilievo letti…';};
  source.on('tileloadend',onBlock);
  try {
    // Centre of the right half (what the relief panel shows), not the crosshair:
    // in the normal view the crosshair sits on the split line.
    const [width,height]=map.getSize();
    const center=map.getCoordinateFromPixel([width*0.75,height/2]);
    const lonLat=transform(center,'EPSG:6875','EPSG:4326');
    const [relief,elevation]=await Promise.all([
      renderRelief({source,style:{color:hillshadeColor()},view:new View(viewOptions(center))}),
      sampleElevation(source,center).catch(()=>null)
    ]);
    const code=encodePoint(lonLat);
    const link=code?SITE+'/'+code:SITE;
    const canvas=await composeCard({relief,placeName:lastPlace,coords:coordsLabel(lonLat),link,
      elevation:elevation===null?null:formatElevation(elevation).replace(':','')});
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const file=new File([blob],snapshotFileName(lonLat),{type:'image/png'});
    snapshotUrl=URL.createObjectURL(blob);
    img.src=snapshotUrl; img.hidden=false;
    el('snapshot-download').href=snapshotUrl;
    el('snapshot-download').download=file.name;
    share.hidden=!navigator.canShare?.({files:[file]});
    share.onclick=()=>navigator.share({files:[file],title:'Il terreno, da vicino',text:'https://'+link}).catch(()=>{});
    actions.hidden=false;
    status.textContent='';
  } catch(error) {
    status.textContent='Cartolina non riuscita: '+(error.message||error);
  } finally {
    source.un('tileloadend',onBlock);
    el('snapshot-wait').hidden=true;
  }
});
showIntroOnce(el('info-dialog'));
// Read-only diagnostics for reproducible browser verification.
window.dtm={map,view,source,stats,minimap,osm,agea,dualView};
if(!document.createElement('canvas').getContext('webgl')) {
  showError(new Error('WebGL non disponibile: il DTM richiede accelerazione grafica nel browser. La sola base OSM non indica che il terreno sia caricato.'));
}
