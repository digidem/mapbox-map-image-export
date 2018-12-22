var Qty = require('js-quantities')
var PNGEncoder = require('png-stream/encoder')
var pumpify = require('pumpify')
var mapboxgl = require('mapbox-gl/dist/mapbox-gl-dev.js')
var mosaic = require('mosaic-image-stream')
var spy = require('through2-spy')
var through = require('through2')

var calcViewport = require('./viewport')
var mapImageStream = require('./map_image_stream')
var getScale = require('./scale')

var DEFAULTS = {
  format: 'image/png',
  quality: 0.9,
  dpi: 192,
  width: '11in',
  height: '8.5in'
}

module.exports = mapMosaicStream

function mapMosaicStream (style, mapDiv, opts) {
  opts = Object.assign({}, DEFAULTS, opts)
  var bbox = parseBboxArg(opts.bbox)

  var token = mapboxgl.accessToken = opts.token
  if (!token) {
    throw new Error('you must pass a valid Mapbox public token: https://www.mapbox.com/studio/account/tokens/')
  }

  var pixelRatio = window.devicePixelRatio = opts.dpi / 96
  // Dimensions in absolute pixels
  var pixelDim = [opts.width, opts.height]
    .map(function (d) { return Math.ceil(parseLengthToPixels(d, opts.dpi) / pixelRatio) * pixelRatio })
  // Dimensions in display pixels
  var dpDim = pixelDim.map(function (d) { return d / pixelRatio })

  var map = new mapboxgl.Map({
    container: mapDiv,
    style: style
  })

  var viewport = calcViewport.fitDim(map, dpDim, bbox)

  map.jumpTo({
    center: viewport.center,
    zoom: viewport.zoom
  })

  console.log('1')

  var scale = getScale(map, dpDim[0], parseLengthToMeters(opts.width))
  console.error('SCALE: 1:%d', scale)
  console.error('ZOOM: %d', viewport.zoom)
  var gl = map.painter.context.gl
  var maxRenderBuf = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
  // Above a certain screen pixel size the map does not render correctly
  var maxTileDim = Array(2).fill(Math.min(Infinity, Math.floor(maxRenderBuf / 2 / pixelRatio)))
  map.remove()
  console.log('2', bbox)

  var t = through(function (chunk, _, next) {
    console.log('png-chunk', chunk.length)
    next(null, chunk)
  })

  var mapDiv = document.createElement('div')
  mapDiv.className = 'map'
  document.body.appendChild(mapDiv)
  var map = window['map' + 0] = new mapboxgl.Map({
    container: mapDiv,
    style: style,
    preserveDrawingBuffer: true
  })

  var pngStream = new PNGEncoder({
    width: pixelDim[0],
    height: pixelDim[1],
    colorSpace: 'rgba'
  })

  map.on('load', function () {
    var mapSingle = mapImageStream(map, dpDim, bbox)

    console.log('4')
    var total = pixelDim[0] * pixelDim[1] * 4
    var complete = 0
    console.log('5')

    var out = pumpify(mapSingle, spy(onChunk), pngStream)
    console.log('6')

    pngStream.on('format', function (f) {
      out.emit('format', f)
    })
    function onChunk (chunk) {
      complete += chunk.length
      console.log('progress', complete, total)
      out.emit('progress', complete / total, total)
    }
  })

  return pngStream
}

function getTileStreams (viewport, dim, maxTileDim, style) {
  var ne = viewport.bounds.getNorthEast()
  var sw = viewport.bounds.getSouthWest()
  var pixels2lng = dim[0] / (ne.lng - sw.lng)
  var pixels2lat = dim[1] / (ne.lat - sw.lat)
  var maxTileDimDeg = [maxTileDim[0] / pixels2lng, maxTileDim[1] / pixels2lat]

  var cols = Math.ceil(dim[0] / maxTileDim[0])
  var rows = Math.ceil(dim[1] / maxTileDim[1])

  return Array(cols).fill(1).map(function (_, i) {
    var row = 0
    var mapDiv = document.createElement('div')
    mapDiv.className = 'map'
    document.body.appendChild(mapDiv)
    var map = window['map' + i] = new mapboxgl.Map({
      container: mapDiv,
      style: style,
      preserveDrawingBuffer: true
    })
    return function createStream (cb) {
      if (row >= rows) return cb(null, null)
      var w = sw.lng + (i * maxTileDimDeg[0])
      var s = Math.max(sw.lat, ne.lat - ((row + 1) * maxTileDimDeg[1]))
      var e = Math.min(ne.lng, sw.lng + ((i + 1) * maxTileDimDeg[0]))
      var n = ne.lat - (row * maxTileDimDeg[1])
      var width = (i + 1) * maxTileDim[0] <= dim[0] ? maxTileDim[0] : dim[0] % maxTileDim[0]
      var height = (row + 1) * maxTileDim[1] <= dim[1] ? maxTileDim[1] : dim[1] % maxTileDim[1]
      row++
      if (map.loaded()) {
        cb(null, mapImageStream(map, [width, height], [w, s, e, n]))
      } else {
        map.on('load', function () {
          cb(null, mapImageStream(map, [width, height], [w, s, e, n]))
        })
      }
    }
  })
}

function parseBboxArg (str) {
  var b = str.split(/,|\s/).map(parseFloat)
  var invalid = b.length !== 4 ||
    b[0] >= b[2] ||
    b[1] >= b[3] ||
    b[0] < -180 ||
    b[2] > 180 ||
    b[1] < -90 ||
    b[3] > 90
  if (invalid) throw new Error('Must pass a valid bounding box')
  return b
}

function parseLengthToMeters (length) {
  var qty = new Qty(length)
  // TODO: This should assume pixels and 96 dpi?
  // as it is this will give a meaningless scale for unitless map sizes
  if (qty.isUnitless()) return length
  return parseFloat(qty.to('meters').toString())
}

function parseLengthToPixels (length, dpi) {
  dpi = dpi || 96
  var qty = new Qty(length)
  if (qty.isUnitless()) return length
  if (qty.kind() !== 'length') throw new Error('Invalid units')
  // Yikes, can't find method to get a unitless number back!
  // TODO: Use a better unit conversion library
  return Math.ceil(parseFloat(qty.to('in').toString()) * dpi)
}

// function parseFormat (format) {
//   switch (format) {
//     case 'jpg':
//     case 'jpeg':
//     case 'image/jpg':
//     case 'image/jpeg':
//       return 'image/jpeg'
//     case 'webp':
//     case 'image/webp':
//       return 'image/webp'
//     default:
//       return 'image/png'
//   }
// }
