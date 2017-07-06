var remote = require('electron').remote
var fs = require('fs')
var path = require('path')
var pump = require('pump')
var log = require('single-line-log').stderr

var exportMap = require('./lib/map_mosaic_stream.js')

window.console = remote.require('./main').console
var argv = remote.require('./main').argv

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
    log(str)
  })
  .on('format', function (f) {
    format = f
  })
pump(mapStream, writeStream, done)

function done (err) {
  log.clear()
  log('')
  if (err) {
    process.stderr.write(err.stack + '\n', () => process.exit(1))
  }
  if (argv.output) {
    console.error('Saved %dpx x %dpx map to %s', format.width, format.height, argv.output)
  }
  window.close()
}

function abs (file) {
  return path.isAbsolute(file)
    ? file
    : path.resolve(process.cwd(), file)
}
