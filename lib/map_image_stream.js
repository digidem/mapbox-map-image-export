var createFBO = require('gl-fbo')
var createGlPixelStream = require('gl-pixel-stream')
var pumpify = require('pumpify')

var calcViewport = require('./viewport')
var limit = require('./limit_stream')

module.exports = mapImageStream

/**
 * Returns a stream of raw image data from a specific map area
 * @param {mapboxgl.Map} map  A mapbox-gl-js map instance (already rendered to the DOM)
 * @param {Array(2)} dim  Dimensions of the map in display pixels `[x, y]`
 * @param {Array(4)} bbox Bbox of area to include in the map in decimal degrees `[W, S, E, N]`
 * @return {ReadableStream} ReadableStream of raw pixel data from the rendered map
 */
function mapImageStream (map, dim, bbox) {
  if (map.__mmie_processing) throw Error('map instance is currently processing')
  map.__mmie_processing = true
  var inprogress = false
  var gl = map.painter.gl
  // Dimensions in absolute pixels (vs. display pixels)
  var pixelDim = dim.map(function (d) { return d * window.devicePixelRatio })

  if (sizeTooBig(gl, pixelDim)) throw Error('map size is too big')

  var stream = pumpify()

  var mapDiv = map.getContainer()
  mapDiv.style.width = dim[0] + 'px'
  mapDiv.style.height = dim[1] + 'px'
  map.resize()._update()
  var viewport = calcViewport(map, dim, bbox)
  var fbo = createFBO(gl, pixelDim, {stencil: true})
  fbo.bind()

  map.once('moveend', function () {
    map.on('render', onRender)
  })

  map.jumpTo({
    center: viewport.center,
    zoom: viewport.zoom
  })

  return stream

  function onRender () {
    if (!map.animationLoop.stopped() || inprogress || !map.loaded()) return
    map.off('render', onRender)
    inprogress = true
    var glStream = createGlPixelStream(gl, fbo.handle, fbo.shape, {flipY: true})
    glStream.on('end', () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      inprogress = false
      map.__mmie_processing = false
      fbo.dispose()
    })
    var format = stream.format = {width: pixelDim[0], height: pixelDim[1], colorSpace: 'rgba'}
    stream.emit('format', format)
    stream.setPipeline(glStream, limit(format))
  }
}

function sizeTooBig (gl, dim) {
  var maxDim = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) / 2
  return dim.filter(function (d) { return d > maxDim }).length
}
