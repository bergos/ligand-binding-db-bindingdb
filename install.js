#!/usr/bin/env node

/* global exec, mkdir, test */

require('shelljs/global')

var path = require('path')

var databaseFile = path.join(__dirname, 'tmp/bindingdb.tsv.zip')

if (!test('-f', databaseFile)) {
  mkdir('-p', 'tmp')
  exec('wget https://www.bindingdb.org/bind/downloads/BindingDB_All_2016m3.tsv.zip -O "' + databaseFile + '"')
}
