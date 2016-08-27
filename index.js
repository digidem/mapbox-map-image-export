var fs = require('fs')
var path = require('path')
var pump = require('pump')

var exportMap = require('./lib/map_mosaic_stream.js')

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    bbox: 'b',
    width: 'w',
    height: 'h',
    dpi: 'd',
    format: 'f',
    output: 'o',
    quality: 'q',
    token: 't'
  },
  string: ['bbox', 'width', 'height', 'format', 'output', 'token']
})

var style = argv._[0]
var format = {}
var width = 40
var last = 0

var writeStream = argv.output ? fs.createWriteStream(abs(argv.output)) : process.stdout
var mapStream = exportMap(style, argv)
  .on('progress', function (percent, total) {
    if ((percent - last) * width < 1) return
    var completeStr = Array(Math.floor(percent * width)).join('=')
    var incompleteStr = Array(Math.ceil((1 - percent) * width)).join(' ')
    var str = 'exporting [' + completeStr + '>' + incompleteStr + '] ' + Math.round(percent * 100) + '%'
    last = percent
    console.log(str)
  })
  .on('format', function (f) {
    format = f
  })
pump(mapStream, writeStream, done)

function done (err) {
  if (err) {
    process.stderr.write(err.stack + '\n', () => process.exit(1))
  }
  if (argv.output) {
    console.log('Saved %dpx x %dpx map to %s', format.width, format.height, argv.output)
  }
  window.close()
}

function abs (file) {
  return path.isAbsolute(file)
    ? file
    : path.resolve(process.cwd(), file)
}
