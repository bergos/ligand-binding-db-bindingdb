var openbabel = require('openbabel-cli')
var rdf = require('rdf-ext')

var ns = {
  hasAssay: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#hasAssay'),
  hasTarget: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#hasTarget'),
  hasMolecule: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#hasMolecule'),
  label: rdf.createNamedNode('http://www.w3.org/2000/01/rdf-schema#label'),
  organismName: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#organismName'),
  publishedType: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#publishedType'),
  publishedValue: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#publishedValue'),
  type: rdf.createNamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  Activity: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#Activity'),
  Assay: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#Assay'),
  CHEMINF_000018: rdf.createNamedNode('http://semanticscience.org/resource/CHEMINF_000018'),
  SingleProtein: rdf.createNamedNode('http://rdf.ebi.ac.uk/terms/chembl#SingleProtein'),
  SIO_000008: rdf.createNamedNode('http://semanticscience.org/resource/SIO_000008'),
  SIO_000300: rdf.createNamedNode('http://semanticscience.org/resource/SIO_000300')
}

function toTripleConfig (base) {
  var activities = {}

  function activityIri (value, row) {
    var iri = base + 'activity/' + row['BindingDB Reactant_set_id']

    if (!(iri in activities)) {
      activities[iri] = rdf.createNamedNode(iri)

      this.push(rdf.createTriple(activities[iri], ns.type, ns.Activity))
    }

    return activities[iri]
  }

  var assays = {}

  function assayIri (value, row) {
    var iri = base + 'assay/' + row['BindingDB Reactant_set_id']

    if (!(iri in assays)) {
      assays[iri] = rdf.createNamedNode(iri)

      this.push(rdf.createTriple(assays[iri], ns.type, ns.Assay))
    }

    return assays[iri]
  }

  var molecules = {}
  var canonicalSmiles = {}

  function toCanonicalSmiles (smiles) {
    return Promise.resolve().then(function () {
      if (!(smiles in canonicalSmiles)) {
        return openbabel.convert(smiles).then(function (canonical) {
          canonicalSmiles[smiles] = canonical
        })
      }
    }).then(function () {
      return canonicalSmiles[smiles]
    })
  }

  function moleculeIri (value, row) {
    var self = this

    return toCanonicalSmiles(row['Ligand SMILES']).then(function (smiles) {
      if (!(smiles in molecules)) {
        var iri = base + 'molecule/' + (Object.keys(molecules).length + 1)

        molecules[smiles] = rdf.createNamedNode(iri)

        var smilesIri = rdf.createNamedNode(iri + '/smiles')

        self.push(rdf.createTriple(molecules[smiles], ns.SIO_000008, smilesIri))
        self.push(rdf.createTriple(smilesIri, ns.type, ns.CHEMINF_000018))
        self.push(rdf.createTriple(smilesIri, ns.SIO_000300, rdf.createLiteral(smiles)))
      }

      return molecules[smiles]
    })
  }

  function mapOrganismName (value, row) {
    // return row['Target Source Organism According to Curator or DataSource']

    return 'Homo sapiens'
  }

  var targets = {}

  function targetIri (value, row) {
    var target = row['UniProt (SwissProt) Recommended Name of Target Chain']
    var organismName = mapOrganismName(value, row)
    var key = target.toLowerCase() + '/' + organismName.toLowerCase()

    if (!(key in targets)) {
      var iri = base + 'target/' + (Object.keys(targets).length + 1)

      targets[key] = rdf.createNamedNode(iri)

      this.push(rdf.createTriple(targets[key], ns.type, ns.SingleProtein))
      this.push(rdf.createTriple(targets[key], ns.label, rdf.createLiteral(row['UniProt (SwissProt) Recommended Name of Target Chain'])))
      this.push(rdf.createTriple(targets[key], ns.organismName, rdf.createLiteral(organismName)))
    }

    return targets[key]
  }

  function kiValue (value) {
    var backup = value.toString()

    value = value.trim()
    value = value.slice(0, 1) === '<' ? 10000 : parseFloat(value)

    if (isNaN(value)) {
      console.error('could not convert: ' + backup)
    }

    return rdf.createLiteral(value)
  }

  var config = {
    subject: {},
    predicate: {},
    object: {}
  }

  config.subject[ns.hasAssay] = activityIri
  config.predicate[ns.hasAssay] = true
  config.object[ns.hasAssay] = assayIri

  config.subject[ns.hasTarget] = assayIri
  config.predicate[ns.hasTarget] = true
  config.object[ns.hasTarget] = targetIri

  config.subject[ns.hasMolecule] = activityIri
  config.predicate[ns.hasMolecule] = true
  config.object[ns.hasMolecule] = moleculeIri

  config.subject[ns.publishedType] = activityIri
  config.predicate[ns.publishedType] = true
  config.object[ns.publishedType] = 'Ki'

  config.subject[ns.publishedValue] = activityIri
  config.predicate[ns.publishedValue] = 'Ki (nM)'
  config.object[ns.publishedValue] = kiValue

  return config
}

module.exports = toTripleConfig

