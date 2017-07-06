#!/usr/bin/env node
var electron = require('electron')
var proc = require('child_process')

var mainProcessScript = require.resolve('./main.js')

var args = [mainProcessScript].concat(process.argv.slice(2))

var child = proc.spawn(electron, args, {stdio: 'inherit'})
child.on('close', function (code) {
  process.exit(code)
})
