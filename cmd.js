#!/usr/bin/env node
var electron = require('electron')
var proc = require('child_process')
var assert = require('assert')
var fs = require('fs')
var path = require('path')

var mainProcessScript = require.resolve('./main.js')

var args = [mainProcessScript].concat(process.argv.slice(2))

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    bbox: 'b',
    width: 'w',
    height: 'h',
    dpi: 'd',
    format: 'f',
    output: 'o',
    quality: 'q',
    token: 't',
    version: 'v'
  },
  default: {
    format: 'image/png',
    quality: 0.9,
    dpi: 192,
    width: '11in',
    height: '8.5in'
  },
  string: ['bbox', 'width', 'height', 'format', 'output', 'token']
})

if (argv.version) {
  console.log(require('./package.json').version)
  process.exit()
}

if (argv.help) {
  console.log(fs.readFileSync(path.join(__dirname, 'usage.txt'), 'utf8'))
  process.exit()
}

validateBbox(argv.bbox)
assert(argv.quality > 0 && argv.quality <= 1, '--quality must be a number between 0 and 1')
assert(typeof argv.dpi === 'number', '--dpi must be a number')
assert(typeof argv.token === 'string', 'Missing --token (must pass a valid Mapbox API token)')

console.log('electron', args)
var child = proc.spawn(electron, args)//, {stdio: 'inherit'})
child.stdout.pipe(process.stdout)
child.stderr.pipe(process.stderr)
child.on('error', function (err) {
  console.log(err)
})
child.on('close', function (code) {
  process.exit(code)
})

function validateBbox (arg) {
  assert(typeof arg === 'string', 'Must pass a bounding box --bbox option')
  var b = arg.split(/,|\s/).map(parseFloat)
  assert(b.length === 4, "--bbox argument must be 4 numbers, separated by ',' or ' '")
  assert(b[0] < b[2] && b[1] < b[3], 'invalid bounding box, check coordinates are WSEN (west, south, east north)')
  assert(b[0] >= -180 && b[2] <= 180 && b[1] >= -90 && b[3] <= 90, 'Invalid bounding box, bounds are outside world bounds')
}
