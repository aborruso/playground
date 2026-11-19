import test from 'node:test';
import assert from 'node:assert/strict';
import {hillshadeColor,reliefVariables} from './relief.js';

function evaluate(expr, sample, vars) {
 if(typeof expr==='number') return expr;
 const [op,...args]=expr;
 if(op==='band') return sample(args[1]||0,args[2]||0);
 if(op==='var') return vars[args[0]];
 if(op==='case') {
  for(let i=0;i<args.length-1;i+=2) if(evaluate(args[i],sample,vars)) return evaluate(args[i+1],sample,vars);
  return evaluate(args.at(-1),sample,vars);
 }
 const a=args.map(v=>evaluate(v,sample,vars));
 switch(op){
 case '+':return a.reduce((x,y)=>x+y,0);
 case '-':return a[0]-a[1];
 case '*':return a.reduce((x,y)=>x*y,1);
 case '/':return a[0]/a[1];
 case '^':return a[0]**a[1];
 case 'sqrt':return Math.sqrt(a[0]);
 case '==':return a[0]===a[1];
 case 'clamp':return Math.min(a[2],Math.max(a[1],a[0]));
 case 'color':return a;
 default:throw new Error(op);
 }
}
const gray=(settings,sample)=>evaluate(hillshadeColor(),sample,reliefVariables(settings))[0];
const nw=(x,y)=>100+5*x+5*y, se=(x,y)=>100-5*x-5*y;

test('terreno piano: grigio finito, opaco e indipendente dalla quota',()=>{
 const low=evaluate(hillshadeColor(),()=>20,reliefVariables());
 const high=evaluate(hillshadeColor(),()=>2000,reliefVariables());
 assert.deepEqual(low,high);
 assert.equal(low[0],low[1]);assert.equal(low[1],low[2]);assert.equal(low[3],1);
 assert.ok(low[0]>100 && low[0]<255);
});
test('valori predefiniti: stesso ombreggiato di prima (luce 315°, 45°)',()=>{
 // Previous formula: 255*(0.22+0.78*clamp((√½+0.5dx+0.5dy)/|n|,0,1)).
 const dx=1,dy=1,old=255*(0.22+0.78*Math.min(1,(Math.SQRT1_2+0.5*dx+0.5*dy)/Math.sqrt(1+dx*dx+dy*dy)));
 assert.ok(Math.abs(gray({},nw)-old)<1e-9);
});
test('pendii verso nord-ovest più chiari dei pendii opposti',()=>{
 assert.ok(gray({},nw)>gray({},se));
 assert.ok(gray({},se)>=0 && gray({},nw)<=255);
});
test('la luce da sud-est inverte i pendii illuminati',()=>{
 assert.ok(gray({azimuth:135},se)>gray({azimuth:135},nw));
});
test('l\'esagerazione verticale accentua il contrasto dei pendii dolci',()=>{
 const up=(x,y)=>100+0.5*x+0.5*y, down=(x,y)=>100-0.5*x-0.5*y;
 const contrast=(exag)=>gray({exag},up)-gray({exag},down);
 assert.ok(contrast(2)>contrast(1));
});
test('pendenza: piano bianco, ripido scuro, indipendente da luce ed esagerazione',()=>{
 const flat=gray({render:'pendenza'},()=>50), steep=gray({render:'pendenza'},nw);
 assert.equal(flat,255);
 assert.ok(steep<flat);
 assert.equal(gray({render:'pendenza',azimuth:90,exag:3},nw),steep);
 assert.equal(gray({render:'pendenza'},se),steep);
});
test('multidirezionale: entro 0-255 e meno buio del singolo sole sul pendio in ombra',()=>{
 const multi=gray({render:'multi'},se);
 assert.ok(multi>=0 && multi<=255);
 assert.ok(multi>=gray({},se));
});
