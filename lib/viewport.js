var mapboxgl = require('mapbox-gl/dist/mapbox-gl-dev.js')
var Decimal = require('decimal.js')

var LngLatBounds = mapboxgl.LngLatBounds
var Point = mapboxgl.Point

module.exports = {
  fitDim: fitDim,
  fitZoom: fitZoom
}

/**
 * Fit a bounding box into a given pixel dimensions (display pixels, not device pixels)
 * and return the zoom, center, and new bounding box for the map view that includes
 * the original bbox, but fills the input dimensions.
 * We use `decimal.js` to reduce floating point rounding errors with all the projection math
 * - the math needs to be accurate because tiles need to line up precisely
 * @param {mapboxgl.Map} map  A mapbox-gl-js map instance - we use this for the projection math, but we do set the zoom on the map, so the map view will change
 * @param {Array(2)} dim      Display pixel dimensions of the desired output
 * @param {Array(4)} bbox     Bounding box of the area to be fitted in the output map, `[w, s, e, n]`
 * @return {Object} Returns an object with the map center and zoom, and the bounds of the view to fit the input pixel dimensions
 */
function fitDim (map, dim, bbox) {
  console.time('calcViewport')
  // The closer the map zoom is to the output zoom, the fewer rounding errors
  // TODO? Once the zoom is calculated, re-run this calculation for higher precision?
  map.setZoom(15)
  var llb = bboxToBounds(bbox)
  var pt = new Point(dim[0], dim[1])
  // NB: Points (in pixels) are measured from the top-left (nw) of the map,
  // whereas LatLng is measured from the bottom-left (sw)
  // took a lot of head scratching before I figured that one out.
  var nw = map.project(llb.getNorthWest())
  var se = map.project(llb.getSouthEast())
  var size = {x: Decimal.sub(se.x, nw.x), y: Decimal.sub(se.y, nw.y)}
  var scaleX = Decimal.div(pt.x, size.x)
  var scaleY = Decimal.div(pt.y, size.y)
  var tr = map.transform
  var zoom = tr.scaleZoom(tr.scale * +Decimal.min(scaleX, scaleY))
  var center = map.unproject(nw.add(se).div(2))
  // Aspect ratio of the input bounding box
  var boundRatio = Decimal.div(size.x, size.y)
  // Aspect ratio of the desired output pixel dimensions
  var areaRatio = Decimal.div(pt.x, pt.y)
  // Calculate how much we need to pad the bounding box by to fill the pixel dimensions
  var padX = areaRatio.greaterThan(boundRatio) ? areaRatio.times(size.y).minus(size.x).div(2) : 0
  var padY = areaRatio.lessThan(boundRatio) ? size.x.div(areaRatio).minus(size.y).div(2) : 0
  var paddedNw = new Point(+Decimal.sub(nw.x, padX), +Decimal.sub(nw.y, padY))
  var paddedSe = new Point(+Decimal.add(se.x, padX), +Decimal.add(se.y, padY))
  var paddedllnw = map.unproject(paddedNw)
  var paddedllse = map.unproject(paddedSe)
  var paddedBounds = new LngLatBounds([
    [paddedllnw.lng, paddedllse.lat],
    [paddedllse.lng, paddedllnw.lat]
  ])

  var viewport = {
    center: center,
    zoom: zoom,
    bearing: 0,
    bounds: paddedBounds
  }
  console.timeEnd('calcViewport')
  return viewport
}

function fitZoom (map, zoom, bbox) {
  map.setZoom(zoom)
  var llb = bboxToBounds(bbox)
  // NB: Points (in pixels) are measured from the top-left (nw) of the map,
  // whereas LatLng is measured from the bottom-left (sw)
  // took a lot of head scratching before I figured that one out.
  var nw = map.project(llb.getNorthWest())
  var se = map.project(llb.getSouthEast())
  var center = map.unproject(nw.add(se).div(2))
  var ratio = window.devicePixelRatio
  var size = se.sub(nw)
  var pixelDim = [size.x * ratio, size.y * ratio]
  var viewport = {
    center: center,
    zoom: zoom,
    bearing: 0,
    bounds: llb,
    pixelDim: pixelDim
  }
  return viewport
}

function bboxToBounds (bbox) {
  return LngLatBounds.convert([[bbox[0], bbox[1]], [bbox[2], bbox[3]]])
}
