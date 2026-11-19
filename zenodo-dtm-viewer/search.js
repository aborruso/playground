// Place search via Nominatim: one request per submit (no autocomplete, per usage policy).
export function nominatimUrl(query) {
  const params=new URLSearchParams({q:query.trim(),format:'jsonv2',countrycodes:'it',limit:'6','accept-language':'it'});
  return 'https://nominatim.openstreetmap.org/search?'+params;
}

// "Luoghi da provare": coordinates from Nominatim (2026-11-18), no request at runtime.
export const SUGGESTED_PLACES=[
  {short:'Etna',name:'Etna, Zafferana Etnea',coords:[14.99403,37.75103]},
  {short:'Vesuvio',name:'Vesuvio, Trecase',coords:[14.42620,40.82140]},
  {short:'Gran Sasso',name:'Gran Sasso, Corno Grande',coords:[13.56963,42.47079]},
  {short:'Matera',name:'Sassi di Matera, Matera',coords:[16.61156,40.66606]},
  {short:'Stromboli',name:'Stromboli, Lipari',coords:[15.21085,38.79303]}
];

// Most recent first, no duplicates, at most `max` entries. Kept in memory only.
export function addRecent(recent,place,max=3) {
  return [place,...recent.filter(item=>item.name!==place.name)].slice(0,max);
}

// Nominatim display_name "Name, Town, Province, …" → title and detail lines.
export function splitPlaceName(displayName) {
  const [name,...rest]=String(displayName||'').split(',').map(part=>part.trim()).filter(Boolean);
  return {name:name||'',detail:rest.filter(part=>part!=='Italia' && !/^\d{5}$/.test(part)).slice(0,3).join(' · ')};
}

export function createPlaceSearch({button,form,input,list,status,suggest,onPick},fetchImpl=globalThis.fetch) {
  let recent=[];
  // The button exists on small screens only; on desktop the form is always visible.
  const collapsible=()=>button.offsetParent!==null;
  const toggle=(open)=>{
    if(!collapsible()) {if(open) input.focus(); else input.blur(); return;}
    form.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
    if(open) input.focus(); else button.focus();
  };
  const choiceButton=(label,detail,onChoose,className)=>{
    const choice=document.createElement('button');
    choice.type='button';
    if(className) choice.className=className;
    choice.append(label);
    if(detail) {const small=document.createElement('small'); small.textContent=detail; choice.append(small);}
    // Keep the focus in the form: the suggestions disappear when it leaves.
    choice.addEventListener('pointerdown',(event)=>event.preventDefault());
    choice.addEventListener('click',onChoose);
    return choice;
  };
  const pick=(coords,name)=>{
    recent=addRecent(recent,{name:name.split(',').map(part=>part.trim()).slice(0,2).join(', '),coords});
    renderSuggestions();
    onPick(coords,name);
    input.value='';
    list.replaceChildren();
    status.textContent='';
    toggle(false);
  };
  function renderSuggestions() {
    if(!suggest) return;
    const title=(text)=>{const p=document.createElement('p'); p.className='search-kicker'; p.textContent=text; return p;};
    const chips=document.createElement('div');
    chips.className='search-chips';
    for(const place of SUGGESTED_PLACES) chips.append(choiceButton(place.short,null,()=>pick(place.coords,place.name)));
    const parts=[title('LUOGHI DA PROVARE'),chips];
    if(recent.length) {
      parts.push(title('RECENTI'));
      for(const place of recent) parts.push(choiceButton('↺ '+place.name,null,()=>pick(place.coords,place.name),'search-recent'));
    }
    suggest.replaceChildren(...parts);
  }
  renderSuggestions();
  button.addEventListener('click',()=>toggle(form.hidden));
  form.addEventListener('keydown',(event)=>{if(event.key==='Escape') {event.stopPropagation(); toggle(false);}});
  input.addEventListener('input',()=>{if(!input.value.trim()) {list.replaceChildren(); status.textContent='';}});
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(!input.value.trim()) return;
    list.replaceChildren();
    status.textContent='Ricerca…';
    try {
      const response=await fetchImpl(nominatimUrl(input.value));
      if(!response.ok) throw new Error('HTTP '+response.status);
      const places=await response.json();
      status.textContent=places.length?'':'Nessun luogo trovato in Italia.';
      for(const place of places) {
        const {name,detail}=splitPlaceName(place.display_name);
        const item=document.createElement('li');
        item.append(choiceButton(name,detail,()=>pick([Number(place.lon),Number(place.lat)],place.display_name)));
        list.append(item);
      }
    } catch(error) {
      status.textContent='Ricerca non riuscita: '+error.message;
    }
  });
  return {focus:()=>toggle(true)};
}
