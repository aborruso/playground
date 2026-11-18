import test from 'node:test';
import assert from 'node:assert/strict';
import {nominatimUrl} from './search.js';
test('ricerca limitata all\'Italia, in italiano, testo ripulito',()=>{
  const url=new URL(nominatimUrl('  Monte Pellegrino '));
  assert.equal(url.origin+url.pathname,'https://nominatim.openstreetmap.org/search');
  assert.equal(url.searchParams.get('q'),'Monte Pellegrino');
  assert.equal(url.searchParams.get('countrycodes'),'it');
  assert.equal(url.searchParams.get('accept-language'),'it');
});
