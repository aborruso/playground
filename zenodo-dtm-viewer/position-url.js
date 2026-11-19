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
export function positionHash([lon,lat],base,mode='tendina') {
  const vista=MODE_PARAM[mode];
  return '#lat='+lat.toFixed(5)+'&lon='+lon.toFixed(5)+(base?'&base='+base:'')+(vista?'&vista='+vista:'');
}
export function readMode(hash) {
  const vista=new URLSearchParams(hash.replace(/^#/,'')).get('vista');
  return vista==='doppia'?'affiancate':vista==='fusione'?'fusione':'tendina';
}
export function readBase(hash) {
  const base=new URLSearchParams(hash.replace(/^#/,'')).get('base');
  return base==='agea'||base==='osm'?base:null;
}
// Google Maps URLs (api=1): map centred on the point, satellite, close zoom.
export function googleMapsUrl([lon,lat],zoom=18) {
  return 'https://www.google.com/maps/@?api=1&map_action=map&center='+lat.toFixed(5)+','+lon.toFixed(5)+'&zoom='+zoom+'&basemap=satellite';
}
