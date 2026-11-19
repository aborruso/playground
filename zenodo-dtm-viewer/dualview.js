import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import Attribution from 'ol/control/Attribution.js';
import {defaults as defaultInteractions} from 'ol/interaction/defaults.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import {transform} from 'ol/proj.js';
import {createAgeaLayer} from './basemaps.js';

// Web Mercator units shrink by cos(lat): this resolution shows `ground` metres per pixel.
export function groundResolution(lat,ground=5) {
  return ground/Math.cos(lat*Math.PI/180);
}

// Left map for the "affiancate" mode: native EPSG:3857 bases, always at the
// same ground scale as the relief. Main -> left follows live (centre and zoom).
// Left -> main only at the end of a gesture, so the DTM side does not fetch blocks
// for every intermediate position (Zenodo rate limit); the main view then snaps
// to the nearest level of the COG, and the left side follows that level.
// The wheel zooms around the crosshair, so zooming alone never moves the DTM.
export function createDualView({target,mainView,mainProjection}) {
  const osm=new TileLayer({source:new OSM(),visible:false});
  const agea=createAgeaLayer();
  const view=new View({projection:'EPSG:3857',enableRotation:false});
  const map=new Map({target,layers:[osm,agea],view,
    controls:[new Attribution({collapsible:false})],
    interactions:defaultInteractions({altShiftDragRotate:false,pinchRotate:false,mouseWheelZoom:false})
      .extend([new MouseWheelZoom({useAnchor:false})])});
  let syncing=false;
  const sync=(action)=>{if(syncing) return; syncing=true; try {action();} finally {syncing=false;}};
  const latitude=()=>transform(mainView.getCenter(),mainProjection,'EPSG:4326')[1];
  // Last state written by follow(): a moveend that only reports it is not a user gesture.
  let followed=null;
  const follow=()=>sync(()=>{
    view.setCenter(transform(mainView.getCenter(),mainProjection,'EPSG:3857'));
    view.setResolution(groundResolution(latitude(),mainView.getResolution()));
    followed={center:view.getCenter().slice(),resolution:view.getResolution()};
  });
  const onlyFollowing=()=>followed && view.getResolution()===followed.resolution &&
    view.getCenter()[0]===followed.center[0] && view.getCenter()[1]===followed.center[1];
  mainView.on(['change:center','change:resolution'],follow);
  map.on('moveend',()=>{
    // While the right side animates, the left one only follows: pushing back
    // would snap the right side to a level mid-animation and stop it.
    if(onlyFollowing()) return;
    sync(()=>{
      const target=transform(view.getCenter(),'EPSG:3857',mainProjection);
      const current=mainView.getCenter();
      // Skip round-trip noise, which would otherwise bounce between the two maps.
      if(Math.hypot(target[0]-current[0],target[1]-current[1])>0.01) mainView.setCenter(target);
      const ground=view.getResolution()*Math.cos(latitude()*Math.PI/180);
      const level=mainView.getConstrainedResolution(ground);
      if(level!==mainView.getResolution()) mainView.setResolution(level);
    });
    // Back on the exact level (also when the gesture went past 5 m or 2560 m).
    follow();
  });
  return {map,view,osm,agea,
    activate() {map.updateSize(); follow();}};
}
