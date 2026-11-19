import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=()=>readFileSync(new URL('./index.html',import.meta.url),'utf8');
test('info: pulsante nel pannello e dialogo con fonte e motivazioni corrette',()=>{
 const page=html();
 assert.match(page,/<button[^>]*id="info-open"[^>]*aria-haspopup="dialog"/);
 assert.match(page,/<dialog id="info-dialog"[^>]*aria-labelledby="info-title"/);
 for(const word of ['34,3 GB','LiDAR','TINITALY','HTTP Range','piramidi','2.560 m','5 m']) assert.ok(page.includes(word),word);
 assert.match(page,/<form method="dialog">/);
 assert.match(page,/© <a[^>]+href="https:\/\/geoportale.agea.gov.it\/"/);
 assert.ok(page.includes('Ortofoto dei voli 2022, 2023 e 2024'));
 assert.ok(page.includes('https://creativecommons.org/licenses/by/4.0/deed.it'));
 assert.match(page,/https:\/\/zenodo.org\/records\/24009736/);
});
test('il popup si chiude anche con un clic fuori dal riquadro',()=>{
 const js=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 assert.match(js,/closeOnBackdrop\(el\('info-dialog'\)\)/);
 assert.match(js,/if\(!inside\) dialog.close\(\)/);
});
