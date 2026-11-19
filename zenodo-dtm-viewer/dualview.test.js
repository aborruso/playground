import test from 'node:test';
import assert from 'node:assert/strict';
import {groundResolution} from './dualview.js';
test('risoluzione Web Mercator per 5 m a terra',()=>{
  assert.equal(groundResolution(0),5);
  assert.ok(Math.abs(groundResolution(60)-10)<1e-9);
});
test('stessa scala a terra per ogni livello del COG',()=>{
  assert.ok(Math.abs(groundResolution(60,80)-160)<1e-9);
});
