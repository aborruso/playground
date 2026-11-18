import Map from 'ol/Map.js';
import WebGLTile from 'ol/layer/WebGLTile.js';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/dm-mono/latin-400.css';

export const CARD=1080, HEADER=150, FOOTER=150, RELIEF_HEIGHT=CARD-HEADER-FOOTER;
export const SITE='dainty-kashata-4413d4.netlify.app';

// Render the relief alone on a hidden map. Once every block is loaded,
// draw one more frame and copy the WebGL canvas inside the layer's
// 'postrender', the only moment its drawing buffer is guaranteed valid.
export function renderRelief({source,style,view}) {
  return new Promise((resolve,reject)=>{
    const target=document.createElement('div');
    target.style.cssText='position:fixed;left:-20000px;top:0;width:'+CARD+'px;height:'+RELIEF_HEIGHT+'px';
    document.body.append(target);
    const layer=new WebGLTile({source,style,cacheSize:256});
    const map=new Map({target,layers:[layer],view,pixelRatio:1,controls:[],interactions:[]});
    const cleanup=()=>{clearTimeout(timer);map.setTarget(null);target.remove();};
    const timer=setTimeout(()=>{cleanup();reject(new Error('lettura del rilievo troppo lenta'));},90000);
    map.once('rendercomplete',()=>{
      layer.once('postrender',(event)=>{
        const out=document.createElement('canvas');
        out.width=CARD; out.height=RELIEF_HEIGHT;
        out.getContext('2d').drawImage(event.context.canvas,0,0,CARD,RELIEF_HEIGHT);
        cleanup();
        resolve(out);
      });
      map.render();
    });
  });
}

function fitText(ctx,text,maxWidth) {
  if(ctx.measureText(text).width<=maxWidth) return text;
  let cut=text;
  while(cut.length>1 && ctx.measureText(cut+'…').width>maxWidth) cut=cut.slice(0,-1);
  return cut.trimEnd()+'…';
}

export async function composeCard({relief,placeName,coords,elevation,link=SITE}) {
  await Promise.all(['64px "Instrument Serif"','italic 64px "Instrument Serif"','20px "DM Mono"'].map(font=>document.fonts.load(font)));
  const canvas=document.createElement('canvas');
  canvas.width=CARD; canvas.height=CARD;
  const ctx=canvas.getContext('2d');
  const left=56, right=CARD-56;
  ctx.fillStyle='#172b27'; ctx.fillRect(0,0,CARD,CARD);
  // Relief band (nodata stays dark green, as on the page).
  ctx.fillStyle='#263c36'; ctx.fillRect(0,HEADER,CARD,RELIEF_HEIGHT);
  ctx.drawImage(relief,0,HEADER);
  // Header: title, then place (only if searched), coordinates and elevation.
  ctx.textBaseline='alphabetic';
  ctx.font='64px "Instrument Serif"'; ctx.fillStyle='#fff9ed';
  ctx.fillText('Il terreno, ',left,84);
  const titleWidth=ctx.measureText('Il terreno, ').width;
  ctx.font='italic 64px "Instrument Serif"'; ctx.fillStyle='#f5d59e';
  ctx.fillText('da vicino.',left+titleWidth,84);
  ctx.font='21px "DM Mono"'; ctx.fillStyle='#eed7ac';
  ctx.fillText(fitText(ctx,[placeName,coords,elevation].filter(Boolean).join('  ·  '),right-left),left,124);
  // Footer: credits required by CC BY 4.0, scale, site address.
  const top=HEADER+RELIEF_HEIGHT;
  ctx.font='18px "DM Mono"'; ctx.fillStyle='#c5cfbf';
  ctx.fillText('DTM 5 m: Panza et al., IRPI-CNR · CC BY 4.0',left,top+46);
  ctx.fillText('zenodo.org/records/18921767',left,top+76);
  ctx.fillStyle='#f5d59e';
  ctx.fillText(link,left,top+114);
  // 1 km at 5 m per pixel = 200 px.
  ctx.strokeStyle='#fff9ed'; ctx.lineWidth=2; ctx.beginPath();
  ctx.moveTo(right-200,top+62); ctx.lineTo(right-200,top+76); ctx.lineTo(right,top+76); ctx.lineTo(right,top+62);
  ctx.stroke();
  ctx.fillStyle='#fff9ed'; ctx.textAlign='right'; ctx.fillText('1 km',right,top+50);
  ctx.textAlign='left';
  return canvas;
}
