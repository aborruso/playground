import Map from 'ol/Map.js';
import WebGLTile from 'ol/layer/WebGLTile.js';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-400-italic.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import {cardCredits} from './card-text.js';

export const CARD=1080, HEADER=150, FOOTER=150;
export const SITE='dainty-kashata-4413d4.netlify.app';
const SERIF='"Newsreader"', MONO='"IBM Plex Mono"';

function hiddenMap(layers,view,height) {
  const target=document.createElement('div');
  target.style.cssText='position:fixed;left:-20000px;top:0;width:'+CARD+'px;height:'+height+'px';
  document.body.append(target);
  const map=new Map({target,layers,view,pixelRatio:1,controls:[],interactions:[]});
  return {map,cleanup:()=>{map.setTarget(null);target.remove();}};
}
function withTimeout(promise,cleanup) {
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{cleanup();reject(new Error('lettura troppo lenta'));},90000);});
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}

// Relief alone on a hidden map. Once every block is loaded, draw one more
// frame and copy the WebGL canvas inside the layer's 'postrender', the only
// moment its drawing buffer is guaranteed valid.
export function renderRelief({source,style,view,height}) {
  const layer=new WebGLTile({source,style,cacheSize:256});
  const {map,cleanup}=hiddenMap([layer],view,height);
  return withTimeout(new Promise((resolve)=>{
    map.once('rendercomplete',()=>{
      layer.once('postrender',(event)=>{
        const out=document.createElement('canvas');
        out.width=CARD; out.height=height;
        out.getContext('2d').drawImage(event.context.canvas,0,0,CARD,height);
        cleanup();
        resolve(out);
      });
      map.render();
    });
  }),cleanup);
}

// Base (AGEA or OSM, reprojected to the DTM grid) on a hidden map: the layer
// canvases are merged as OpenLayers lays them out. The tiles are served with
// CORS, so the canvas stays exportable.
export function renderBase({layers,view,height}) {
  const {map,cleanup}=hiddenMap(layers,view,height);
  return withTimeout(new Promise((resolve)=>{
    map.once('rendercomplete',()=>{
      const out=document.createElement('canvas');
      out.width=CARD; out.height=height;
      const ctx=out.getContext('2d');
      for(const canvas of map.getViewport().querySelectorAll('.ol-layer canvas')) {
        if(!canvas.width) continue;
        const opacity=canvas.parentNode.style.opacity || canvas.style.opacity;
        ctx.globalAlpha=opacity===''?1:Number(opacity);
        const matrix=canvas.style.transform.match(/^matrix\(([^(]*)\)$/)?.[1].split(',').map(Number);
        ctx.setTransform(...(matrix || [1,0,0,1,0,0]));
        ctx.drawImage(canvas,0,0);
      }
      ctx.setTransform(1,0,0,1,0,0);
      ctx.globalAlpha=1;
      cleanup();
      resolve(out);
    });
  }),cleanup);
}

function fitText(ctx,text,maxWidth) {
  if(ctx.measureText(text).width<=maxWidth) return text;
  let cut=text;
  while(cut.length>1 && ctx.measureText(cut+'…').width>maxWidth) cut=cut.slice(0,-1);
  return cut.trimEnd()+'…';
}

// image: 'rilievo', 'orto' or 'split' (base on the left half, relief on the right).
export async function composeCard({image='rilievo',relief,base,baseName='agea',height,placeName,coords,elevation,link=SITE}) {
  await Promise.all(['52px '+SERIF,'italic 52px '+SERIF,'20px '+MONO].map(font=>document.fonts.load(font)));
  const canvas=document.createElement('canvas');
  canvas.width=CARD; canvas.height=HEADER+height+FOOTER;
  const ctx=canvas.getContext('2d');
  const left=56, right=CARD-56;
  ctx.fillStyle='#18261f'; ctx.fillRect(0,0,canvas.width,canvas.height);
  // Image band (nodata stays dark green, as on the page).
  ctx.fillStyle='#1b2a24'; ctx.fillRect(0,HEADER,CARD,height);
  if(image==='orto') ctx.drawImage(base,0,HEADER);
  else if(image==='split') {
    ctx.drawImage(base,0,0,CARD/2,height,0,HEADER,CARD/2,height);
    ctx.drawImage(relief,CARD/2,0,CARD/2,height,CARD/2,HEADER,CARD/2,height);
    ctx.fillStyle='#f2ede1'; ctx.fillRect(CARD/2-1,HEADER,2,height);
  } else ctx.drawImage(relief,0,HEADER);
  // Header: searched place (or the site title), then coordinates and elevation.
  ctx.textBaseline='alphabetic';
  if(placeName) {
    ctx.font='52px '+SERIF; ctx.fillStyle='#f2ede1';
    ctx.fillText(fitText(ctx,placeName,right-left),left,80);
  } else {
    ctx.font='52px '+SERIF; ctx.fillStyle='#f2ede1';
    ctx.fillText('Il terreno, ',left,80);
    const titleWidth=ctx.measureText('Il terreno, ').width;
    ctx.font='italic 52px '+SERIF; ctx.fillStyle='#e9c980';
    ctx.fillText('da vicino.',left+titleWidth,80);
  }
  ctx.font='21px '+MONO; ctx.fillStyle='#e9c980';
  ctx.fillText(fitText(ctx,[coords,elevation].filter(Boolean).join('  ·  '),right-left),left,122);
  // Footer: credits required by CC BY 4.0, scale, site address.
  const top=HEADER+height;
  ctx.font='18px '+MONO; ctx.fillStyle='#d9d4c7';
  const [first,second]=cardCredits(image,baseName);
  ctx.fillText(first,left,top+46);
  ctx.fillText(second,left,top+76);
  ctx.fillStyle='#e9c980';
  ctx.fillText(link,left,top+114);
  // 1 km at 5 m per pixel = 200 px.
  ctx.strokeStyle='#f2ede1'; ctx.lineWidth=2; ctx.beginPath();
  ctx.moveTo(right-200,top+62); ctx.lineTo(right-200,top+76); ctx.lineTo(right,top+76); ctx.lineTo(right,top+62);
  ctx.stroke();
  ctx.fillStyle='#f2ede1'; ctx.textAlign='right'; ctx.fillText('1 km',right,top+50);
  ctx.textAlign='left';
  return canvas;
}
