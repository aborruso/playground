// Relief rendered in the WebGL shader from the native 5 m elevations.
// Light, exaggeration and rendering type are style variables: changing them
// redraws the blocks already read, with no new request to Zenodo.
export const RELIEF_DEFAULTS={render:'ombra',azimuth:315,altitude:45,exag:1};
export const RENDERS=['ombra','multi','pendenza'];
const MODE={ombra:0,multi:1,pendenza:2};
// Multidirectional: four lights fanned around the chosen azimuth, as in GDAL.
const MULTI_OFFSETS=[-90,-45,0,45];

// Light vector in texture terms (x east, y south): illumination is
// (dx*x + dy*y + z) / |normal|, with dx and dy the elevation differences.
export function lightVector(azimuth,altitude) {
  const az=azimuth*Math.PI/180, alt=altitude*Math.PI/180;
  return [-Math.sin(az)*Math.cos(alt),Math.cos(az)*Math.cos(alt),Math.sin(alt)];
}

export function reliefVariables(settings={}) {
  const s={...RELIEF_DEFAULTS,...settings};
  const vars={mode:MODE[s.render] ?? 0,exag:s.exag};
  MULTI_OFFSETS.forEach((offset,i)=>{
    const [x,y,z]=lightVector(s.azimuth+offset,s.altitude);
    Object.assign(vars,{['l'+i+'x']:x,['l'+i+'y']:y,['l'+i+'z']:z});
  });
  return vars;
}

// Central differences at the native 5 m spacing. Texture y grows southward.
export function hillshadeColor() {
  const rawDx=['/',['-',['band',1,1,0],['band',1,-1,0]],10];
  const rawDy=['/',['-',['band',1,0,1],['band',1,0,-1]],10];
  const dx=['*',rawDx,['var','exag']], dy=['*',rawDy,['var','exag']];
  const normalLength=['sqrt',['+',1,['^',dx,2],['^',dy,2]]];
  const light=(i)=>['clamp',['/',['+',['var','l'+i+'z'],['*',dx,['var','l'+i+'x']],['*',dy,['var','l'+i+'y']]],normalLength],0,1];
  const shade=(illumination)=>['*',255,['+',0.22,['*',0.78,illumination]]];
  // Slope is real terrain steepness: no exaggeration. sin(slope) = g/sqrt(1+g^2).
  const gradient=['sqrt',['+',['^',rawDx,2],['^',rawDy,2]]];
  const sinSlope=['/',gradient,['sqrt',['+',1,['^',gradient,2]]]];
  const slope=['*',255,['-',1,['*',0.88,sinSlope]]];
  const multi=shade(['/',['+',light(0),light(1),light(2),light(3)],4]);
  const gray=['case',['==',['var','mode'],2],slope,['==',['var','mode'],1],multi,shade(light(2))];
  return ['color',gray,gray,gray,1];
}

export function reliefStyle(settings) {
  return {variables:reliefVariables(settings),color:hillshadeColor()};
}
