import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readPosition,positionHash,readBase,readDual} from './position-url.js';

test('senza coordinate condivise il punto iniziale è Etna',()=>{
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 assert.ok(main.includes('readPosition(window.location.hash) || [14.99,37.75]'));
});

test('legge latitudine e longitudine dal link condiviso',()=>{
 assert.deepEqual(readPosition('#lat=38.12000&lon=13.35000'),[13.35,38.12]);
});
test('coordinate mancanti, non numeriche o fuori range non spostano la vista',()=>{
 for(const hash of ['', '#lat=&lon=13','#lat=abc&lon=13','#lat=91&lon=13','#lat=38','#lat=38&lon=190']) {
  assert.equal(readPosition(hash),null);
 }
});
test('scrive coordinate leggibili e ripristinabili senza zoom',()=>{
 const hash=positionHash([13.350001,38.120002]);
 assert.equal(hash,'#lat=38.12000&lon=13.35000');
 assert.deepEqual(readPosition(hash),[13.35,38.12]);
});
test('la base scelta viaggia nel link',()=>{
 assert.equal(positionHash([13.35,38.12],'osm'),'#lat=38.12000&lon=13.35000&base=osm');
 assert.equal(readBase('#lat=38.12000&lon=13.35000&base=agea'),'agea');
 assert.equal(readBase('#lat=38.12000&lon=13.35000&base=xyz'),null);
 assert.equal(readBase('#lat=38.12000&lon=13.35000'),null);
});
test('la modalità due mirini viaggia nel link',()=>{
 assert.equal(positionHash([13.35,38.12],'osm',true),'#lat=38.12000&lon=13.35000&base=osm&vista=doppia');
 assert.equal(readDual('#lat=38.12000&lon=13.35000&vista=doppia'),true);
 assert.equal(readDual('#lat=38.12000&lon=13.35000'),false);
});
