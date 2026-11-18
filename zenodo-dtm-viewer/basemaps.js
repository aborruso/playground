import LayerGroup from 'ol/layer/Group.js';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';

export function createAgeaLayer() {
  return new LayerGroup({visible:true,layers:[2022,2023,2024].map(year=>
    new TileLayer({properties:{year},source:new XYZ({
      url:'https://geoportale.agea.gov.it/image/rest/services/AgEA/Ortofoto_AgEA_'+year+
        '/ImageServer/WMTS/tile/1.0.0/AgEA_Ortofoto_AgEA_'+year+'/default/GoogleMapsCompatible/{z}/{y}/{x}',
      projection:'EPSG:3857',maxZoom:23,crossOrigin:'anonymous',
      attributions:'© <a href="https://geoportale.agea.gov.it/" target="_blank" rel="noreferrer">AGEA</a> · CC BY 4.0'
    })})
  )});
}
