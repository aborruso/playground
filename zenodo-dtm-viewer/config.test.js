import test from 'node:test';
import assert from 'node:assert/strict';
import {viewOptions, LEVELS, rangeFetch, rightHalfExtent, leftHalfExtent, clampSplit, createRateGate} from './config.js';

test('il DTM copre solo la metà destra della viewport',()=>{
 assert.deepEqual(rightHalfExtent([100,200,1100,800]),[600,200,1100,800]);
});
test('il divisore della tendina sposta il confine fra base e rilievo',()=>{
 assert.deepEqual(rightHalfExtent([100,200,1100,800],0.2),[300,200,1100,800]);
 assert.deepEqual(leftHalfExtent([100,200,1100,800],0.2),[100,200,300,800]);
 assert.equal(clampSplit(-1),0.05); assert.equal(clampSplit(2),0.95); assert.equal(clampSplit(0.3),0.3);
});

test('la risoluzione rimane 5 m anche con tentativi di zoom',()=> {
 const v=viewOptions([0,0]);
 assert.equal(v.resolution,5); assert.equal(v.minResolution,5); assert.equal(v.maxResolution,5); assert.equal(v.enableRotation,false);
});
test('blocca richieste senza Range prima di contattare Zenodo',async()=>{
 await assert.rejects(rangeFetch('https://zenodo.org/file'), /Range/);
});
test('rifiuta una risposta integrale e ne annulla il body',async()=>{
 let cancelled=false;
 const fake=async()=>({status:200,body:{cancel:async()=>{cancelled=true;}}});
 await assert.rejects(rangeFetch('https://zenodo.org/file',{headers:{Range:'bytes=0-511'}},fake), /206/);
 assert.equal(cancelled,true);
});
test('conta i byte effettivi delle risposte parziali',async()=>{
 let stats;
 const response=new Response(new Uint8Array(512),{status:206});
 const result=await rangeFetch('https://zenodo.org/file',{headers:{Range:'bytes=0-511'}},async()=>response,s=>stats=s);
 assert.equal(result.status,206); assert.equal(stats.bytes,512); assert.equal(stats.status,206);
});
test('con HTTP 429 attende la riapertura della finestra e ripete la richiesta',async()=>{
 let calls=0,waited=0;
 const now=()=>1_000_000;
 const gate=createRateGate({now,sleep:async(ms)=>{waited+=ms;}});
 const fake=async()=>++calls===1
  ? new Response(null,{status:429,headers:{'X-RateLimit-Remaining':'0','X-RateLimit-Reset':String(1_000_000/1000+20)}})
  : new Response(new Uint8Array(8),{status:206});
 const result=await rangeFetch('https://zenodo.org/file',{headers:{Range:'bytes=0-7'}},fake,()=>{},gate);
 assert.equal(result.status,206); assert.equal(calls,2);
 assert.ok(waited>=20000 && waited<=21000, String(waited));
});
test('quando restano poche richieste, la successiva aspetta senza provocare un 429',async()=>{
 let waited=0;
 const gate=createRateGate({now:()=>0,sleep:async(ms)=>{waited+=ms;}});
 gate.update(new Headers({'X-RateLimit-Remaining':'1','X-RateLimit-Reset':'30'}),206);
 await gate.wait();
 assert.ok(waited>=30000 && waited<=31000, String(waited));
});
test('attesa mai oltre 65 s anche con orologio sfasato',async()=>{
 let waited=0;
 const gate=createRateGate({now:()=>0,sleep:async(ms)=>{waited+=ms;}});
 gate.update(new Headers({'X-RateLimit-Remaining':'0','X-RateLimit-Reset':'99999'}),429);
 await gate.wait();
 assert.equal(waited,65000);
});
test('zoom libero: solo i livelli del file, da 5 a 2560 m',()=>{
 assert.deepEqual(LEVELS,[2560,1280,640,320,160,80,40,20,10,5]);
 const v=viewOptions([0,0],true);
 assert.equal(v.resolution,5); assert.equal(v.constrainResolution,true); assert.equal(v.enableRotation,false);
});
