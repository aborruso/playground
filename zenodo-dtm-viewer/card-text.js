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

// Postcard sizes: width 1080, header and footer 150 px each, image in between.
export const CARD_FORMATS={'4:3':810,'1:1':1080,'4:5':1350};
export function cardImageHeight(format) {
  return (CARD_FORMATS[format] ?? CARD_FORMATS['1:1'])-300;
}

// Footer lines: CC BY 4.0 credits for every source shown, then the DTM record.
export function cardCredits(image,base) {
  const dtm='DTM 5 m · Panza et al., IRPI-CNR · CC BY 4.0';
  const baseCredit=base==='osm'?'Base © OpenStreetMap contributors · ODbL':'Ortofoto © AGEA · CC BY 4.0';
  return image==='rilievo'?[dtm,'zenodo.org/records/18921767']:[dtm,baseCredit];
}
