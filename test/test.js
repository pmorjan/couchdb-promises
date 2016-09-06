// http://docs.couchdb.org/en/stable/api/index.html
// https://github.com/substack/tape#methods
'use strict'
const util = require('util')
//
const test = require('tape')
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const prefix = 'testdb_' + Date.now() + '_'

function getName () {
  return prefix + Math.random().toString(36).slice(2, 8)
}

function checkResponse (t, response, status) {
  t.test('check response object', function (ts) {
    ts.plan(3)
    ts.true(response.data, 'response.data is not empty')
    ts.true(response.message, 'response.message is not empty')
    ts.deepEqual(response.status, status, 'response.status is ' + status)
  })
  return response
}

test('url does not belong to a couchdb server', function (t) {
  t.plan(1)
  db.listDatabases('http://www.google.com')
  .catch(response => checkResponse(t, response, 500))
})

test('url with invalid protocol', function (t) {
  t.plan(1)
  db.listDatabases('ftp://www.google.com')
  .catch(response => checkResponse(t, response, 400))
})

test('getUuids', function (t) {
  t.plan(4)
  db.getUuids(baseUrl, 10)
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.deepEqual(Object.prototype.toString.call(response.data.uuids), '[object Array]', 'object is Array')
    t.deepEqual(response.data.uuids.length, 10, 'array contains 10 elements')
    t.true(response.data.uuids[0].match(/^[a-z0-9]+$/), 'first element looks like a UUID')
  })
  .catch(response => console.error(util.inspect(response)))
})

test('listDatabases', function (t) {
  t.plan(1)
  db.listDatabases(baseUrl)
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase with error', function (t) {
  t.plan(2)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDatabase(baseUrl, '%123'))   // invalid dbName
  .catch(response => checkResponse(t, response, 400))
  .then(response => db.createDatabase(baseUrl, dbName))   // db alredy exists
  .catch(response => checkResponse(t, response, 412))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDatabase', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDatabase with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.deleteDatabase(baseUrl, dbName)
  .catch(response => checkResponse(t, response, 404))   // not found
})

test('createDocument no id', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc))
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument by id', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument by id whith error', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, 201))
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc')) // conflict
  .catch(response => checkResponse(t, response, 409))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument update', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    let doc = response.data
    doc.baz = 42
    return db.createDocument(baseUrl, dbName, doc, 'doc')
  })
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDocument', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDocument(baseUrl, dbName, 'doc', response.data._rev))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocument', function (t) {
  t.plan(4)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    let doc = response.data
    doc.baz = 42
    return db.createDocument(baseUrl, dbName, doc, 'doc')
  })
  .then(response => checkResponse(t, response, 201))
  .then(response => db.getDocument(baseUrl, dbName, 'doc', {rev: response.data.rev}))
  .then(response => checkResponse(t, response, 200))
  .then(response => t.deepEqual(response.data.baz, 42), 'doc constains new property')
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('db server is clean', function (t) {
  const re = new RegExp('^' + prefix)
  setTimeout(() => {
    // sometimes remote DB need some time, e.g. CloudantDB
    t.plan(1)
    db.listDatabases(baseUrl)
    .then(response => t.false(response.data.find(e => re.test(e)), 'all tempdb deleted'))
  }, 1000)
})
