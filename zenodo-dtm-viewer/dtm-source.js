import GeoTIFF from 'ol/source/GeoTIFF.js';

// GeoTIFF source that reads one extra pixel around each block (a "gutter").
// The hillshade compares each pixel with its neighbours: without the gutter,
// neighbours across a block edge are missing and every edge draws a flat line.
// Relies on GeoTIFF internals of ol 10.6.1 (pinned in package.json).
export class GutteredGeoTIFF extends GeoTIFF {
  constructor(options,gutter=1) {
    super(options);
    this.gutter_=gutter;
  }
  loadTile_(z,x,y,options) {
    const g=this.gutter_;
    for(const images of this.sourceImagery_) {
      const image=images[z];
      if(!image || image.guttered) continue;
      const read=image.readRasters.bind(image);
      image.readRasters=(opts)=>read({...opts,
        window:[opts.window[0]-g,opts.window[1]-g,opts.window[2]+g,opts.window[3]+g],
        width:opts.width+2*g,height:opts.height+2*g});
      image.guttered=true;
    }
    return super.loadTile_(z,x,y,options);
  }
  composeTile_(size,samples) {
    return super.composeTile_([size[0]+2*this.gutter_,size[1]+2*this.gutter_],samples);
  }
}
