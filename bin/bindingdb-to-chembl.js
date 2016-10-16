#!/usr/bin/env node

var program = require('commander')
var toChembl = require('..')

function processBindings () {
  var options = {
    base: program.base,
    verbose: program.verbose
  }

  return Promise.resolve().then(function () {
    return toChembl(program.args.shift(), process.stdout, options)
  }).catch(function (error) {
    process.stderr.write('error: ' + (error.stack || error.message) + '\n')
  })
}

program
  .usage('[options] <file>')
  .option('-v, --verbose', 'verbose output')
  .option('-b, --base <baseUrl>', 'base URL')

program.parse(process.argv)

processBindings()
