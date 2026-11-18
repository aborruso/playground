// Central differences at the native 5 m spacing. Texture y grows southward.
// Light: azimuth 315° (NW), altitude 45°. Ambient light keeps shadows legible.
export function hillshadeColor() {
  const dx=['/',['-',['band',1,1,0],['band',1,-1,0]],10];
  const dy=['/',['-',['band',1,0,1],['band',1,0,-1]],10];
  const normalLength=['^',['+',1,['^',dx,2],['^',dy,2]],0.5];
  const illumination=['/',['+',Math.SQRT1_2,['*',0.5,dx],['*',0.5,dy]],normalLength];
  const gray=['*',255,['+',0.22,['*',0.78,['clamp',illumination,0,1]]]];
  return ['color',gray,gray,gray,1];
}
