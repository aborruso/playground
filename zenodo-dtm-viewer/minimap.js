import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Style from 'ol/style/Style.js';
import Icon from 'ol/style/Icon.js';
import {transform,transformExtent} from 'ol/proj.js';

const ITALY_EXTENT=transformExtent([6,35,19,48],'EPSG:4326','EPSG:3857');

export function createItalyMinimap(target,mainView) {
  const marker=new Point([0,0]);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path d="M12 31S1 19 1 12a11 11 0 0 1 22 0c0 7-11 19-11 19Z" fill="#c34225" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>';
  const map=new Map({
    target, controls:[], interactions:[], pixelRatio:1,
    layers:[
      new TileLayer({source:new OSM()}),
      new VectorLayer({
        source:new VectorSource({features:[new Feature(marker)]}),
        style:new Style({image:new Icon({src:'data:image/svg+xml,'+encodeURIComponent(svg),anchor:[0.5,1]})})
      })
    ],
    view:new View({enableRotation:false})
  });
  const fitItaly=()=>{
    const size=map.getSize();
    if(size?.[0]>0 && size?.[1]>0) map.getView().fit(ITALY_EXTENT,{size,padding:[8,8,8,8]});
  };
  map.on('change:size',fitItaly);
  fitItaly();
  const sync=()=>marker.setCoordinates(transform(mainView.getCenter(),mainView.getProjection(),'EPSG:3857'));
  mainView.on('change:center',sync);
  map.on('singleclick',({coordinate})=>{
    mainView.setCenter(transform(coordinate,'EPSG:3857',mainView.getProjection()));
  });
  sync();
  return {map,marker};
}
