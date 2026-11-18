import test from 'node:test';
import assert from 'node:assert/strict';
import {showIntroOnce,INTRO_SEEN_KEY} from './intro.js';

function storage(){
 const data=new Map();
 return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
}
test('prima visita: apre il dialogo e ricorda di averlo mostrato',()=>{
 const local=storage();let opens=0;
 assert.equal(showIntroOnce({showModal(){opens++;}},local),true);
 assert.equal(opens,1);
 assert.equal(local.getItem(INTRO_SEEN_KEY),'1');
});
test('visite successive: non riapre il dialogo',()=>{
 const local=storage();local.setItem(INTRO_SEEN_KEY,'1');
 assert.equal(showIntroOnce({showModal(){throw new Error('Non deve aprirsi');}},local),false);
});
test('storage bloccato: mostra le informazioni senza bloccare la mappa',()=>{
 let opens=0;
 const local={getItem(){throw new Error('Storage bloccato');},setItem(){throw new Error('Storage bloccato');}};
 assert.equal(showIntroOnce({showModal(){opens++;}},local),true);
 assert.equal(opens,1);
});
