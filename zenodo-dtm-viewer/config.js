// Zenodo 24009736 (v1.3): COG, ZSTD, nodata NaN, overviews down to 2560 m.
export const DTM_URL = 'https://zenodo.org/api/records/24009736/files/HRDM5m_20261030_cog.tif/content';
// Split the screen extent at a fraction of its width (0.5 = two halves).
export function leftHalfExtent([minX,minY,maxX,maxY],split=0.5) {
  return [minX,minY,minX+(maxX-minX)*split,maxY];
}
export function rightHalfExtent([minX,minY,maxX,maxY],split=0.5) {
  return [minX+(maxX-minX)*split,minY,maxX,maxY];
}
// Divider of the "tendina" view, kept away from the edges so both sides stay visible.
export function clampSplit(value) {
  return Math.min(0.95,Math.max(0.05,value));
}
// Resolutions of the file's levels: 5 m and its 9 overviews, up to 2560 m.
export const LEVELS=Array.from({length:10},(_,i)=>5*2**(9-i));
// free=false: fixed 5 m (postcard). free=true: zoom snaps to the file's levels,
// so every view reads exactly one level.
export function viewOptions(center,free=false) {
  if(free) return {center, projection:'EPSG:6875', resolutions:LEVELS, resolution:5,
    constrainResolution:true, enableRotation:false};
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
