var fs = require('fs')
var test = require('tape')
var Pbf = require('pbf')
var geojsonVt = require('geojson-vt')
var VectorTile = require('vector-tile').VectorTile
var GeoJsonEquality = require('geojson-equality')
var eq = new GeoJsonEquality({ precision: 1 })

var serialize = require('../')

test('geojson-vt tiles', function (t) {
  var orig = JSON.parse(fs.readFileSync(__dirname + '/fixtures/rectangle.geojson'))
  var tileindex = geojsonVt(orig)
  var tile = tileindex.getTile(1, 0, 0)

  var buff = serialize.fromGeojsonVt({
    'geojsonLayer': tile
  })

  // make sure it parses correctly in vector-tile-js
  var tile3 = new VectorTile(new Pbf(buff))
  var layer = tile3.layers['geojsonLayer']
  var features = []
  for (var i = 0; i < layer.length; i++) {
    var feat = layer.feature(i).toGeoJSON(0, 0, 1)
    features.push(feat)
  }

  t.plan(orig.features.length)
  orig.features.forEach(function (expected) {
    var actual = features.shift()
    t.ok(eq.compare(actual, expected))
  })
})

test('vector-tile-js tiles', function (t) {
  var data = fs.readFileSync(__dirname + '/fixtures/rectangle-1.0.0.pbf')
  var tile = new VectorTile(new Pbf(data))

  var buff = serialize(tile)
  var tile3 = new VectorTile(new Pbf(buff))

  var orig = tile.layers['geojsonLayer']
  t.plan(orig.length)

  var layer = tile3.layers['geojsonLayer']
  for (var i = 0; i < layer.length; i++) {
    var actual = orig.feature(i).toGeoJSON(0, 0, 1)
    var expected = layer.feature(i).toGeoJSON(0, 0, 1)
    t.ok(eq.compare(actual, expected))
  }
})

test('JSON.stringify non-primitive properties', function (t) {
  var orig = JSON.parse(fs.readFileSync(__dirname + '/fixtures/rectangle.geojson'))
  var obj = orig.features[0].properties.obj = { hello: 'world' }
  var arr = orig.features[0].properties.arr = [1, 2, 3]

  var tileindex = geojsonVt(orig)
  var tile = tileindex.getTile(1, 0, 0)
  var buff = serialize.fromGeojsonVt({ 'geojsonLayer': tile })

  var vt = new VectorTile(new Pbf(buff))
  var layer = vt.layers['geojsonLayer']
  var feat = layer.feature(0)

  t.same(feat.properties.obj, JSON.stringify(obj))
  t.same(feat.properties.arr, JSON.stringify(arr))
  t.end()
})

