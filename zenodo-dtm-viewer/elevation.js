import TileState from 'ol/TileState.js';
import {containsCoordinate} from 'ol/extent.js';

export async function sampleElevation(source,coordinate) {
  const grid=source.getTileGrid();
  if(!grid || !containsCoordinate(grid.getExtent(),coordinate)) return null;
  const z=grid.getResolutions().length-1;
  const tileCoord=grid.getTileCoordForCoordAndZ(coordinate,z);
  const tile=source.getTile(...tileCoord,1,source.getProjection());
  if(!tile) return null;
  await new Promise((resolve,reject)=>{
    const check=()=>{
      const state=tile.getState();
      if(state===TileState.LOADED || state===TileState.EMPTY || state===TileState.ERROR) {
        tile.removeEventListener('change',check);
        if(state===TileState.ERROR) reject(new Error('Impossibile leggere il blocco del DTM'));
        else resolve();
      }
    };
    tile.addEventListener('change',check);
    check();
    tile.load();
  });
  if(tile.getState()===TileState.EMPTY) return null;
  const data=tile.getData();
  const extent=grid.getTileCoordExtent(tileCoord);
  const resolution=grid.getResolution(z);
  // Tile data may carry a gutter of extra pixels on every side.
  const gutter=source.getGutterForProjection?.(source.getProjection()) || 0;
  const [tileWidth,tileHeight]=tile.getSize();
  const width=tileWidth+2*gutter;
  const col=Math.floor((coordinate[0]-extent[0])/resolution);
  const row=Math.floor((extent[3]-coordinate[1])/resolution);
  if(col<0||row<0||col>=tileWidth||row>=tileHeight) return null;
  const bands=source.bandCount;
  const offset=((row+gutter)*width+col+gutter)*bands;
  const elevation=data[offset];
  if(!Number.isFinite(elevation)||elevation===-9999||(bands>1&&data[offset+bands-1]===0)) return null;
  return elevation;
}
export function formatElevation(value) {
  return value===null?'Nessun dato':'Quota: '+value.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+' m';
}
