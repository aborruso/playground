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
import {addRecent,splitPlaceName,SUGGESTED_PLACES} from './search.js';
test('recenti: ultimo in testa, niente doppioni, al massimo tre',()=>{
  let recent=[];
  for(const name of ['A','B','C','A','D']) recent=addRecent(recent,{name});
  assert.deepEqual(recent.map(p=>p.name),['D','A','C']);
});
test('risultato Nominatim diviso in nome e dettaglio, senza CAP e Italia',()=>{
  assert.deepEqual(splitPlaceName('Stromboli, Lipari, Messina, Sicilia, 98050, Italia'),{name:'Stromboli',detail:'Lipari · Messina · Sicilia'});
});
test('luoghi da provare: cinque, dentro l\'Italia',()=>{
  assert.equal(SUGGESTED_PLACES.length,5);
  for(const {coords:[lon,lat]} of SUGGESTED_PLACES) assert.ok(lon>6 && lon<19 && lat>35 && lat<48);
});
