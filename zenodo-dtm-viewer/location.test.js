import test from 'node:test';
import assert from 'node:assert/strict';
import {getPosition} from './location.js';

test('restituisce longitudine e latitudine senza modificare zoom', async()=>{
 const geo={getCurrentPosition(success,error,options){
   assert.equal(options.timeout,15000);
   success({coords:{longitude:13.35,latitude:38.12}});
 }};
 assert.deepEqual(await getPosition(geo),[13.35,38.12]);
});
test('spiega il permesso negato',async()=>{
 await assert.rejects(getPosition({getCurrentPosition(ok,fail){fail({code:1});}}),/Permesso/);
});
test('gestisce browser senza geolocalizzazione',async()=>{
 await assert.rejects(getPosition(null),/non disponibile/);
});
test('gestisce timeout',async()=>{
 await assert.rejects(getPosition({getCurrentPosition(ok,fail){fail({code:3});}}),/Tempo/);
});
