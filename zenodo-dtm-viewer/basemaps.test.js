import test from 'node:test';
import assert from 'node:assert/strict';
import {createAgeaLayer} from './basemaps.js';
import {leftHalfExtent} from './config.js';

test('AGEA sovrappone 2022, 2023, 2024 senza selezione geografica',()=>{
 const group=createAgeaLayer();
 assert.equal(group.getVisible(),true);
 const layers=group.getLayers().getArray();
 assert.equal(layers.length,3);
 assert.deepEqual(layers.map(l=>l.get('year')),[2022,2023,2024]);
 for(const layer of layers){
  assert.equal(layer.getVisible(),true);
  const url=layer.getSource().getUrls()[0];
  assert.ok(url.includes('Ortofoto_AgEA_'+layer.get('year')));
  assert.ok(url.endsWith('/GoogleMapsCompatible/{z}/{y}/{x}'));
  assert.equal(layer.getSource().getProjection().getCode(),'EPSG:3857');
 }
});
test('la base rimane nella metà sinistra',()=>{
 assert.deepEqual(leftHalfExtent([100,200,1100,800]),[100,200,600,800]);
});
