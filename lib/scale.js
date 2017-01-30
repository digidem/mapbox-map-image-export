// Largely copied from https://github.com/mapbox/mapbox-gl-js/blob/master/js/ui/control/scale_control.js
// License: BSD-3-Clause

module.exports = getScale

function getScale (map, mapWidthDisplayPixels, outputWidthMeters) {
  console.log(mapWidthDisplayPixels, outputWidthMeters)
    // A horizontal scale is imagined to be present at center of the map
    // container with maximum length (Default) as 100px.
    // Using spherical law of cosines approximation, the real distance is
    // found between the two coordinates.
  var maxWidth = 100

  var y = map._container.clientHeight / 2
  var width100pxMeters = getDistance(map.unproject([0, y]), map.unproject([maxWidth, y]))
  var mapRealWidthMeters = width100pxMeters * mapWidthDisplayPixels / maxWidth
  return mapRealWidthMeters / outputWidthMeters
}

function getDistance (latlng1, latlng2) {
  // Uses spherical law of cosines approximation.
  var R = 6371000

  var rad = Math.PI / 180
  var lat1 = latlng1.lat * rad
  var lat2 = latlng2.lat * rad
  var a = Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad)

  var maxMeters = R * Math.acos(Math.min(a, 1))
  return maxMeters
}
