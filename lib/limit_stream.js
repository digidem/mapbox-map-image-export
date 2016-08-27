var through = require('through2')
var once = require('once')

// color space component counts
var COMPONENTS = {
  rgb: 3,
  rgba: 4,
  cmyk: 4,
  gray: 1,
  graya: 2,
  indexed: 1
}

var DEFAULTS = {
  width: 0,
  height: 0,
  colorSpace: 'rgba'
}

/**
 * Limit a stream to a fixed number of bytes based on
 * width, height and colorSpace
 * @param {object} opts
 * @param {number} opts.width Image width
 * @param {number} opts.height Image height
 * @param {string} opts.colorSpace One of `rgb|rgba|cmyk|gray|graya|indexed`
 * @return {Stream} Transform Stream
 */
module.exports = function (opts) {
  var format = Object.assign({}, DEFAULTS, opts)
  var limit = format.width * format.height * COMPONENTS[format.colorSpace]
  var consumed = 0
  var stream = through(function (chunk, enc, next) {
    emitFormat()
    if (consumed >= limit) return next(null, null)
    consumed += chunk.length
    // console.log(chunk.slice(0, limit - consumed + chunk.length).length)
    next(null, chunk.slice(0, limit - consumed + chunk.length))
  }).once('pipe', function (src) {
    src.on('format', function (srcFormat) {
      Object.assign(format, srcFormat)
    })
  })
  var emitFormat = once(function () {
    stream.emit('format', Object.assign({}, format))
  })
  return stream
}
