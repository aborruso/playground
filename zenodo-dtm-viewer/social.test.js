import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const origin='https://dainty-kashata-4413d4.netlify.app';
test('anteprime social complete e statiche, leggibili senza JavaScript',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 for(const key of ['og:type','og:title','og:description','og:url','og:image','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt','og:locale','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt']){
  assert.match(html,new RegExp('(?:property|name)="'+key+'" content="[^"<]+"'),key);
 }
 assert.ok(html.includes('content="summary_large_image"'));
 assert.ok(html.includes('href="'+origin+'/"'));
 assert.ok(html.includes('content="'+origin+'/og-image.png"'));
 assert.match(html,/<meta name="description" content="[^"<]+"/);
});
test('immagine condivisa PNG 1200×630',()=>{
 const png=readFileSync(new URL('./public/og-image.png',import.meta.url));
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
 assert.ok(png.length<2000000);
});
