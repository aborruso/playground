export function getPosition(geolocation=globalThis.navigator?.geolocation) {
  return new Promise((resolve,reject)=>{
    if (!geolocation) return reject(new Error('Geolocalizzazione non disponibile: usa HTTPS o localhost.'));
    geolocation.getCurrentPosition(
      ({coords})=>resolve([coords.longitude,coords.latitude]),
      ({code})=>reject(new Error(code===1?'Permesso di localizzazione negato.':code===3?'Tempo di localizzazione scaduto. Riprova.':'Posizione non disponibile.')),
      {enableHighAccuracy:true,timeout:15000,maximumAge:60000}
    );
  });
}
