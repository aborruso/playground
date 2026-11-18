// Six-character codes for a point in Italy, with no server or database:
// lat/lon rounded to 0.0001° (about 10 m) inside 35-48° N, 6-19° E,
// combined into one integer and written in base 62.
const ALPHABET='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const LAT0=35, LON0=6, STEP=1e-4, SIDE=130001, LENGTH=6;

export function encodePoint([lon,lat]) {
  const i=Math.round((lat-LAT0)/STEP), j=Math.round((lon-LON0)/STEP);
  if(i<0 || j<0 || i>=SIDE || j>=SIDE) return null;
  let n=i*SIDE+j, code='';
  for(let k=0;k<LENGTH;k++) {code=ALPHABET[n%62]+code; n=Math.floor(n/62);}
  return code;
}

export function decodePoint(code) {
  if(!/^[0-9A-Za-z]{6}$/.test(code||'')) return null;
  let n=0;
  for(const char of code) n=n*62+ALPHABET.indexOf(char);
  const i=Math.floor(n/SIDE), j=n%SIDE;
  if(i>=SIDE) return null;
  return [Number((LON0+j*STEP).toFixed(4)),Number((LAT0+i*STEP).toFixed(4))];
}
