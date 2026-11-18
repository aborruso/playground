import test from 'node:test';
import assert from 'node:assert/strict';
import {encodePoint,decodePoint} from './shortcode.js';
test('codice di 6 caratteri, andata e ritorno entro 0,0001°',()=>{
  for(const p of [[15.21118,38.7918],[13.31433,38.2175],[11.06437,46.53327],[6,35],[19,48]]) {
    const code=encodePoint(p);
    assert.match(code,/^[0-9A-Za-z]{6}$/);
    const [lon,lat]=decodePoint(code);
    assert.ok(Math.abs(lon-p[0])<=5e-5+1e-9 && Math.abs(lat-p[1])<=5e-5+1e-9, code);
  }
});
test('fuori dall\'Italia o codice non valido: nessun punto',()=>{
  assert.equal(encodePoint([2.35,48.85]),null);
  assert.equal(decodePoint('abc'),null);
  assert.equal(decodePoint('zzzzzz'),null);
  assert.equal(decodePoint('assets'),decodePoint('assets'));
});
