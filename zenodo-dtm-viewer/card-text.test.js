import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shortPlaceName,coordsLabel,snapshotFileName} from './card-text.js';
test('nome breve del luogo: primi due elementi del nome Nominatim',()=>{
  assert.equal(shortPlaceName('Monte Pellegrino, Palermo, Sicilia, 90167, Italia'),'Monte Pellegrino, Palermo');
  assert.equal(shortPlaceName(''),'');
});
test('coordinate con la virgola decimale e nome file stabile',()=>{
  assert.equal(coordsLabel([13.3538,38.16611]),'38,16611° N  13,35380° E');
  assert.equal(snapshotFileName([13.3538,38.16611]),'terreno-da-vicino_38.16611_13.35380.png');
});
test('il luogo cercato decade al primo spostamento',()=>{
  const js=readFileSync(new URL('./main.js',import.meta.url),'utf8');
  assert.match(js,/view.on\('change:center',\(\)=>\{if\(!picking\) lastPlace=null;\}\)/);
});
