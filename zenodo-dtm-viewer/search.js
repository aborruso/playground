// Place search via Nominatim: one request per submit (no autocomplete, per usage policy).
export function nominatimUrl(query) {
  const params=new URLSearchParams({q:query.trim(),format:'jsonv2',countrycodes:'it',limit:'6','accept-language':'it'});
  return 'https://nominatim.openstreetmap.org/search?'+params;
}

export function createPlaceSearch({button,form,input,list,status,onPick},fetchImpl=globalThis.fetch) {
  const toggle=(open)=>{
    form.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
    if(open) input.focus(); else button.focus();
  };
  button.addEventListener('click',()=>toggle(form.hidden));
  form.addEventListener('keydown',(event)=>{if(event.key==='Escape') toggle(false);});
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
        const item=document.createElement('li');
        const choice=document.createElement('button');
        choice.type='button';
        choice.textContent=place.display_name;
        choice.addEventListener('click',()=>{onPick([Number(place.lon),Number(place.lat)],place.display_name);toggle(false);});
        item.append(choice);
        list.append(item);
      }
    } catch(error) {
      status.textContent='Ricerca non riuscita: '+error.message;
    }
  });
}
