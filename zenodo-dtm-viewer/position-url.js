export function readPosition(hash) {
  const params=new URLSearchParams(hash.replace(/^#/,''));
  const latText=params.get('lat'), lonText=params.get('lon');
  if(!latText?.trim() || !lonText?.trim()) return null;
  const lat=Number(latText),lon=Number(lonText);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return null;
  return [lon,lat];
}
// View modes: tendina (default, no parameter), affiancate (vista=doppia, the
// name used by older links), fusione (vista=fusione).
const MODE_PARAM={affiancate:'doppia',fusione:'fusione'};
// Zoom as metres per pixel (res=80); omitted at the full 5 m, so older links stay valid.
export function positionHash([lon,lat],base,mode='tendina',resolution=5) {
  const vista=MODE_PARAM[mode];
  return '#lat='+lat.toFixed(5)+'&lon='+lon.toFixed(5)+(base?'&base='+base:'')+(vista?'&vista='+vista:'')+
    (resolution!==5?'&res='+resolution:'');
}
// One of the file's levels: any other positive number goes to the nearest one
// (in powers of two); missing or invalid: null, i.e. the full 5 m.
export function readResolution(hash,levels) {
  const value=Number(new URLSearchParams(hash.replace(/^#/,'')).get('res'));
  if(!Number.isFinite(value) || value<=0) return null;
  return levels.reduce((best,level)=>Math.abs(Math.log2(level/value))<Math.abs(Math.log2(best/value))?level:best);
}
export function readMode(hash) {
  const vista=new URLSearchParams(hash.replace(/^#/,'')).get('vista');
  return vista==='doppia'?'affiancate':vista==='fusione'?'fusione':'tendina';
}
export function readBase(hash) {
  const base=new URLSearchParams(hash.replace(/^#/,'')).get('base');
  return base==='agea'||base==='osm'?base:null;
}
// Google Maps with a red pin on the point, satellite (t=k), zoom 16 (~1.9 m/px: streets in view).
// The official api=1 URLs put a pin only in "search", which has no satellite
// or zoom; this classic form does all three (checked 2026-11-19).
export function googleMapsUrl([lon,lat],zoom=16) {
  return 'https://www.google.com/maps?q='+lat.toFixed(5)+','+lon.toFixed(5)+'&t=k&z='+zoom;
}
