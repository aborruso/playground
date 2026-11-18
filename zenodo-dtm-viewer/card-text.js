// Text helpers for the 1:1 postcard (no DOM, unit-tested).
export function shortPlaceName(displayName) {
  return String(displayName||'').split(',').map(part=>part.trim()).filter(Boolean).slice(0,2).join(', ');
}

export function coordsLabel([lon,lat]) {
  const fmt=(value)=>Math.abs(value).toFixed(5).replace('.',',');
  return fmt(lat)+'° '+(lat>=0?'N':'S')+'  '+fmt(lon)+'° '+(lon>=0?'E':'O');
}

export function snapshotFileName([lon,lat]) {
  return 'terreno-da-vicino_'+lat.toFixed(5)+'_'+lon.toFixed(5)+'.png';
}
