const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

const argv = module.exports.argv = require('yargs-parser')(process.argv.slice(2), {
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
  boolean: ['debug'],
  string: ['bbox', 'width', 'height', 'format', 'output', 'token'],
  default: {
    token: process.env.MAPBOX_TOKEN
  }
})

module.exports.console = console

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ show: !!argv.debug })
  if (argv.debug) win.webContents.openDevTools()
  // win.webContents.openDevTools()
  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit()
})
