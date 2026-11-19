import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import Attribution from 'ol/control/Attribution.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import {defaults as defaultInteractions} from 'ol/interaction/defaults.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import {transform} from 'ol/proj.js';
import {createAgeaLayer} from './basemaps.js';

// Web Mercator units shrink by cos(lat): this resolution shows 5 m on the ground.
export function groundResolution(lat) {
  return 5/Math.cos(lat*Math.PI/180);
}

// Left map for the "two crosshairs" mode: native EPSG:3857 bases, free zoom.
// Main -> left follows live; left -> main only at the end of a gesture, so the
// DTM side does not fetch blocks for every intermediate position (Zenodo rate limit).
// The wheel zooms around the crosshair, so zooming alone never moves the DTM.
export function createDualView({target,mainView,mainProjection,scaleTarget}) {
  const osm=new TileLayer({source:new OSM(),visible:false});
  const agea=createAgeaLayer();
  const view=new View({projection:'EPSG:3857',enableRotation:false,minZoom:5,maxZoom:20});
  const map=new Map({target,layers:[osm,agea],view,
    controls:[new Attribution({collapsible:false}),new ScaleLine({target:scaleTarget})],
    interactions:defaultInteractions({altShiftDragRotate:false,pinchRotate:false,mouseWheelZoom:false})
      .extend([new MouseWheelZoom({useAnchor:false})])});
  let syncing=false;
  const sync=(action)=>{if(syncing) return; syncing=true; try {action();} finally {syncing=false;}};
  mainView.on('change:center',()=>sync(()=>view.setCenter(transform(mainView.getCenter(),mainProjection,'EPSG:3857'))));
  map.on('moveend',()=>sync(()=>{
    const target=transform(view.getCenter(),'EPSG:3857',mainProjection);
    const current=mainView.getCenter();
    // Skip round-trip noise, which would otherwise bounce between the two maps.
    if(Math.hypot(target[0]-current[0],target[1]-current[1])>0.01) mainView.setCenter(target);
  }));
  const groundTarget=()=>groundResolution(transform(view.getCenter(),'EPSG:3857','EPSG:4326')[1]);
  return {map,view,osm,agea,
    // True when the left side shows the same 5 m ground scale as the DTM.
    isAligned() {return Math.abs(view.getResolution()/groundTarget()-1)<0.01;},
    alignZoom() {view.animate({resolution:groundTarget(),duration:250});},
    // Magnification of the left side relative to the 5 m of the relief.
    zoomFactor() {return groundTarget()/view.getResolution();},
    zoomBy(delta) {
      const zoom=view.getConstrainedZoom(view.getZoom()+delta);
      if(zoom!==undefined) view.animate({zoom,duration:200});
    },
    activate() {
      const [lon,lat]=transform(mainView.getCenter(),mainProjection,'EPSG:4326');
      map.updateSize();
      sync(()=>{
        view.setCenter(transform([lon,lat],'EPSG:4326','EPSG:3857'));
        view.setResolution(groundResolution(lat));
      });
    }};
}
