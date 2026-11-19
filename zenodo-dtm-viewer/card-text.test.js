import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shortPlaceName,coordsLabel,snapshotFileName,cardImageHeight,cardCredits} from './card-text.js';
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
  assert.match(js,/view.on\('change:center',\(\)=>\{if\(!picking\) lastPlace=null; updatePlace\(\);\}\)/);
});
test('formati della cartolina: 4:3, 1:1 e 4:5 larghi 1080, immagine fra testata e piede',()=>{
  assert.equal(cardImageHeight('4:3'),510);
  assert.equal(cardImageHeight('1:1'),780);
  assert.equal(cardImageHeight('4:5'),1050);
  assert.equal(cardImageHeight('xyz'),780);
});
test('crediti: il DTM sempre, la base solo quando compare',()=>{
  assert.deepEqual(cardCredits('rilievo','agea'),['DTM 5 m · Panza et al., IRPI-CNR · CC BY 4.0','zenodo.org/records/18921767']);
  assert.match(cardCredits('orto','agea')[1],/AGEA · CC BY 4.0/);
  assert.match(cardCredits('split','osm')[1],/OpenStreetMap/);
  assert.match(cardCredits('split','agea')[0],/Panza/);
});
