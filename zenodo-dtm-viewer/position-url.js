export function readPosition(hash) {
  const params=new URLSearchParams(hash.replace(/^#/,''));
  const latText=params.get('lat'), lonText=params.get('lon');
  if(!latText?.trim() || !lonText?.trim()) return null;
  const lat=Number(latText),lon=Number(lonText);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return null;
  return [lon,lat];
}
export function positionHash([lon,lat],base,dual=false) {
  return '#lat='+lat.toFixed(5)+'&lon='+lon.toFixed(5)+(base?'&base='+base:'')+(dual?'&vista=doppia':'');
}
export function readDual(hash) {
  return new URLSearchParams(hash.replace(/^#/,'')).get('vista')==='doppia';
}
export function readBase(hash) {
  const base=new URLSearchParams(hash.replace(/^#/,'')).get('base');
  return base==='agea'||base==='osm'?base:null;
}
