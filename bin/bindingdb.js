#!/usr/bin/env node

var path = require('path')
var Fuseki = require('fuseki')

var server = new Fuseki({pipeOutput: true})

server.start()

server.wait().then(function () {
  server.createDataset('/bindingdb', 'tdb', path.join(__dirname, '../tmp/bindingdb.nt'))
}).catch(function (err) {
  console.error(err.stack || err.message)
})
