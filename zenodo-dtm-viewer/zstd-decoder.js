import {addDecoder,BaseDecoder} from 'geotiff';
import {ZSTDDecoder} from 'zstddec';

// The DTM (Zenodo 24009736) is ZSTD-compressed (TIFF code 50000), which
// geotiff.js 2.1.3 does not decode. zstddec is already installed with it;
// BaseDecoder applies the floating point predictor (3) after this step.
// Registered in this module's registry, i.e. on the main thread: the reads
// therefore skip OpenLayers' worker pool (see dtm-source.js).
const zstd=new ZSTDDecoder();
export class ZstdDecoder extends BaseDecoder {
  // GDAL's ZSTD frames do not state their content size: give the block size.
  constructor(fileDirectory) {
    super();
    const tiled=!fileDirectory.StripOffsets;
    const width=tiled?fileDirectory.TileWidth:fileDirectory.ImageWidth;
    const height=tiled?fileDirectory.TileLength:(fileDirectory.RowsPerStrip || fileDirectory.ImageLength);
    const bytesPerPixel=fileDirectory.BitsPerSample.reduce((sum,bits)=>sum+bits/8,0);
    this.blockBytes=width*height*(fileDirectory.PlanarConfiguration===2?fileDirectory.BitsPerSample[0]/8:bytesPerPixel);
  }
  decodeBlock(buffer) {
    return zstd.decode(new Uint8Array(buffer),this.blockBytes).buffer;
  }
}
export const ZSTD=50000;
addDecoder(ZSTD,async()=>{await zstd.init(); return ZstdDecoder;});
