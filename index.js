/* globals mapboxgl */
var fs = require('fs')
var path = require('path')
var Qty = require('js-quantities')
var remote = require('electron').remote
var toBuffer = require('blob-to-buffer')
var geoViewport = require('geo-viewport')

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    bounds: 'b',
    width: 'w',
    height: 'h',
    dpi: 'd',
    format: 'f',
    output: 'o',
    quality: 'q',
    token: 't'
  },
  default: {
    format: 'image/png',
    quality: 0.9,
    dpi: 144,
    width: '11in',
    height: '8.5in'
  },
  string: ['bounds', 'width', 'height', 'format', 'output', 'token']
})

if (!argv.t) {
  throw new Error('you must pass a valid Mapbox public token: https://www.mapbox.com/studio/account/tokens/')
}

var style = argv._[0]
var outFile = absolute(argv.output)

var pixelRatio = window.devicePixelRatio = argv.dpi / 72
var winWidth = parseInt(parseLengthToPixels(argv.width) / pixelRatio, 10)
var winHeight = parseInt(parseLengthToPixels(argv.height) / pixelRatio, 10)

var mapDiv = document.getElementById('map')
mapDiv.style.width = winWidth + 'px'
mapDiv.style.height = winHeight + 'px'

mapboxgl.accessToken = argv.token

var map = new mapboxgl.Map({
  container: 'map',
  style: style,
  preserveDrawingBuffer: true
})

fitBounds(map, parseBounds(argv.bounds))

map.on('load', function () {
  map.getCanvas().toBlob(write, parseFormat(argv.format), argv.quality)
})

function parseBounds (bounds) {
  var b = bounds.split(',').map(parseFloat)
  if (b.length !== 4) throw new Error('Must pass a valid bounding box')
  return [[b[0], b[1]], [b[2], b[3]]]
}

function parseLengthToPixels (length) {
  var qty = new Qty(length)
  if (qty.isUnitless()) return length
  if (qty.kind() !== 'length') throw new Error('Invalid units')
  // Yikes, can't find method to get a unitless number back!
  // TODO: Use a better unit conversion library
  return parseFloat(qty.to('in').toString()) * window.devicePixelRatio * 72
}

function parseFormat (format) {
  switch (format) {
    case 'jpg':
    case 'jpeg':
    case 'image/jpg':
    case 'image/jpeg':
      return 'image/jpeg'
    case 'webp':
    case 'image/webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

function fitBounds (map, bounds) {
  var llb = mapboxgl.LngLatBounds.convert(bounds)
  var dim = map.project(map.getBounds().getSouthEast())
  var nw = map.project(llb.getNorthWest())
  var se = map.project(llb.getSouthEast())
  var size = se.sub(nw)
  var scaleX = dim.x / size.x
  var scaleY = dim.y / size.y
  var tr = map.transform
  var zoom = tr.scaleZoom(tr.scale * Math.min(scaleX, scaleY))

  var options = {
    center: map.unproject(nw.add(se).div(2)),
    zoom: zoom,
    bearing: 0
  }

  map.jumpTo(options)
}

function write (blob) {
  toBuffer(blob, function (err, buf) {
    if (err) return done(err)
    if (outFile) {
      fs.writeFile(outFile, buf, done)
    } else {
      process.stdout.write(buf, done)
    }
  })
}

function done (err) {
  if (err) {
    process.stderr.write(err.stack + '\n', () => process.exit(1))
  } else {
    window.close()
  }
}

function absolute (file) {
  if (!file) return null
  return path.isAbsolute(file)
    ? file
    : path.resolve(process.cwd(), file)
}
