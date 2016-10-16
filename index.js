var Promise = require('bluebird')
var csvParser = require('ligand-binding-utils/csv-parse-stream')
var toTriple = require('ligand-binding-utils/object-to-triple-stream')
var toTripleConfig = require('./lib/to-triple-config')
var filter = require('ligand-binding-utils/filter-stream')
var openZip = Promise.promisify(require('yauzl').open)
var LineStream = require('byline').LineStream
var NTriplesSerializer = require('ligand-binding-utils/rdf-serializer-ntriples')

function rowFilter (row) {
  var kiValue = row['Ki (nM)'].trim()

  kiValue = kiValue.slice(0, 1) === '<' ? 10000 : parseFloat(kiValue)

  return row['Ligand SMILES'] && row['UniProt (SwissProt) Recommended Name of Target Chain'] && !isNaN(kiValue)
}

function toChembl (filename, outputStream, options) {
  options = options || {}
  options.base = options.base || 'http://www.bindingdb.org/bind/'

  return new Promise(function (resolve, reject) {
    openZip(filename).then(function (zipfile) {
      zipfile.on('entry', function (entry) {
        zipfile.openReadStream(entry, function (err, inputStream) {
          if (err) {
            return reject(err)
          }

          var serializer = NTriplesSerializer()

          serializer.on('error', reject)
          serializer.on('end', resolve)

          inputStream
            .pipe(new LineStream())
            .pipe(csvParser({columns: true, delimiter: '\t'}))
            .pipe(filter(rowFilter))
            .pipe(toTriple(toTripleConfig(options.base)))
            .pipe(serializer)
            .pipe(outputStream)
        })
      })
    }).catch(reject)
  })
}

module.exports = toChembl
