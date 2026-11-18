import test from 'node:test';
import assert from 'node:assert/strict';
import {hillshadeColor} from './relief.js';

function evaluate(expr, sample) {
 if(typeof expr==='number') return expr;
 const [op,...args]=expr;
 if(op==='band') return sample(args[1]||0,args[2]||0);
 const a=args.map(v=>evaluate(v,sample));
 switch(op){
 case '+':return a.reduce((x,y)=>x+y,0);
 case '-':return a[0]-a[1];
 case '*':return a.reduce((x,y)=>x*y,1);
 case '/':return a[0]/a[1];
 case '^':return a[0]**a[1];
 case 'clamp':return Math.min(a[2],Math.max(a[1],a[0]));
 case 'color':return a;
 default:throw new Error(op);
 }
}
test('terreno piano: grigio finito, opaco e indipendente dalla quota',()=>{
 const low=evaluate(hillshadeColor(),()=>20);
 const high=evaluate(hillshadeColor(),()=>2000);
 assert.deepEqual(low,high);
 assert.equal(low[0],low[1]);assert.equal(low[1],low[2]);assert.equal(low[3],1);
 assert.ok(low[0]>100 && low[0]<255);
});
test('pendii verso nord-ovest più chiari dei pendii opposti',()=>{
 const facing=evaluate(hillshadeColor(),(x,y)=>100+5*x+5*y);
 const away=evaluate(hillshadeColor(),(x,y)=>100-5*x-5*y);
 assert.ok(facing[0]>away[0]);
 assert.ok(away[0]>=0 && facing[0]<=255);
});
