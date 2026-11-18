import test from 'node:test';
import assert from 'node:assert/strict';
import DataTile from 'ol/DataTile.js';
import TileGrid from 'ol/tilegrid/TileGrid.js';
import {sampleElevation,formatElevation} from './elevation.js';

function raster(values,loader){
 const grid=new TileGrid({origin:[0,10],resolutions:[5],tileSize:2,extent:[0,0,10,10]});
 return {bandCount:2,getTileGrid:()=>grid,getProjection:()=>null,
  getTile:(z,x,y)=>new DataTile({tileCoord:[z,x,y],size:[2,2],loader:loader||(()=>Promise.resolve(new Float32Array(values)))})};
}
test('legge la quota originale della cella giusta, non un colore del rilievo',async()=>{
 const source=raster([12.5,1,34.25,1,56,1,78.5,1]);
 assert.equal(await sampleElevation(source,[2.5,7.5]),12.5);
 assert.equal(await sampleElevation(source,[7.5,2.5]),78.5);
});
test('zero e quote negative sono valide',async()=>{
 const source=raster([0,1,-3,1,56,1,78.5,1]);
 assert.equal(await sampleElevation(source,[2.5,7.5]),0);
 assert.equal(await sampleElevation(source,[7.5,7.5]),-3);
});
test('fuori copertura, nodata e pixel trasparenti non mostrano quote',async()=>{
 assert.equal(await sampleElevation(raster([]),[-10,0]),null);
 assert.equal(await sampleElevation(raster([-9999,1,0,0,NaN,1,2,1]),[2.5,7.5]),null);
 assert.equal(await sampleElevation(raster([0,0,2,1,3,1,4,1]),[2.5,7.5]),null);
});
test('se il blocco non si carica segnala errore',async()=>{
 await assert.rejects(sampleElevation(raster([],async()=>{throw new Error('Rete');}),[2.5,7.5]),/blocco/);
});
test('quota leggibile in metri, nessun falso zero se manca il dato',()=>{
 assert.equal(formatElevation(123.45),'Quota: 123,5 m');
 assert.equal(formatElevation(null),'Nessun dato');
});
test('con il gutter legge la cella giusta, non il bordo aggiunto',async()=>{
 const grid=new TileGrid({origin:[0,10],resolutions:[5],tileSize:2,extent:[0,0,10,10]});
 // 4x4 data (2x2 tile + 1 px gutter), 2 bands; inner cells 11,12,21,22.
 const v=[0,0,0,0, 0,11,12,0, 0,21,22,0, 0,0,0,0].flatMap(x=>[x,1]);
 const source={bandCount:2,getTileGrid:()=>grid,getProjection:()=>null,getGutterForProjection:()=>1,
  getTile:(z,x,y)=>new DataTile({tileCoord:[z,x,y],size:[2,2],loader:()=>Promise.resolve(new Float32Array(v))})};
 assert.equal(await sampleElevation(source,[2.5,7.5]),11);
 assert.equal(await sampleElevation(source,[7.5,2.5]),22);
});
