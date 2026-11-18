export const DTM_URL = 'https://zenodo.org/api/records/18921767/files/HRDTM5m/content';
export function leftHalfExtent([minX,minY,maxX,maxY]) {
  return [minX,minY,(minX+maxX)/2,maxY];
}
export function rightHalfExtent([minX,minY,maxX,maxY]) {
  return [(minX+maxX)/2,minY,maxX,maxY];
}
export function viewOptions(center) {
  return {center, projection:'EPSG:6875', resolution:5, minResolution:5, maxResolution:5,
    enableRotation:false, smoothResolutionConstraint:false};
}
// Zenodo allows a fixed number of requests per window and exposes
// X-RateLimit-Remaining/Reset to the browser (Retry-After is not exposed by CORS).
// Requests wait for the window to reopen instead of failing with 429.
const sleepFor=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
export function createRateGate({now=()=>Date.now(),sleep=sleepFor,onWait=()=>{}}={}) {
  let resumeAt=0;
  return {
    async wait() {
      const ms=resumeAt-now();
      if(ms>0) {onWait(Math.ceil(ms/1000)); await sleep(ms);}
    },
    update(headers,status) {
      const remaining=headers?.get?.('X-RateLimit-Remaining');
      if(status!==429 && (remaining===null || remaining===undefined || Number(remaining)>1)) return;
      const reset=Number(headers?.get?.('X-RateLimit-Reset'))*1000;
      const target=Number.isFinite(reset) && reset>0 ? reset+500 : now()+30000;
      resumeAt=Math.max(resumeAt,Math.min(target,now()+65000));
    }
  };
}
// Refuse full downloads before consuming their response body.
export async function rangeFetch(url, options={}, fetchImpl=globalThis.fetch, onRead=()=>{}, gate=null) {
  const headers = new Headers(options.headers);
  if (!headers.has('Range')) throw new Error('Richiesta senza Range bloccata');
  let response;
  for (let attempt=0; attempt<5; attempt++) {
    await gate?.wait();
    response = await fetchImpl(url, options);
    gate?.update(response.headers, response.status);
    if (response.status !== 429 || !gate) break;
    await response.body?.cancel();
  }
  if (response.status !== 206) {
    await response.body?.cancel();
    throw new Error('Zenodo non ha restituito HTTP 206: download bloccato ('+response.status+')');
  }
  const data = await response.arrayBuffer();
  onRead({bytes:data.byteLength,status:response.status,range:headers.get('Range')});
  return new Response(data,{status:206,headers:response.headers});
}
