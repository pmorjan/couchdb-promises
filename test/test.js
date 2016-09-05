// http://docs.couchdb.org/en/1.6.1/api/index.html
// https://github.com/substack/tape#methods
'use strict'
const util = require('util')
//
const test = require('tape')
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'

function getName () {
  return 'testdb_' + Math.random().toString(36).slice(2, 12)
}

function checkResponse (t, response, status) {
  t.test('check response object', function (ts) {
    ts.plan(3)
    ts.true(response.data, 'data is not empty')
    ts.true(response.message, 'message is not empty')
    ts.deepEqual(response.status, status, 'status is ' + status)
  })
  return response
}

test('url does not belong to a couchdb server', function (t) {
  t.plan(2)
  db.listDatabases('http://www.google.com')
  .catch(response => checkResponse(t, response, 500))
  .then(() => t.pass('done'))
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
    t.deepEqual(Object.prototype.toString.call(response.data.uuids), '[object Array]')
    t.deepEqual(response.data.uuids.length, 10)
    t.true(response.data.uuids[0].match(/^[a-z0-9]+$/))
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

test('deleteDatabase with erorr', function (t) {
  t.plan(2)
  const dbName = getName()
  db.deleteDatabase(baseUrl, '%123')
  .catch(response => checkResponse(t, response, 400))   // invalid dbName
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => checkResponse(t, response, 404))   // not found
})

test('createDocument', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, 'doc', doc))
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument whith error', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, 'doc', doc))
  .then(response => checkResponse(t, response, 201))
  .then(response => db.createDocument(baseUrl, dbName, 'doc', doc)) // conflict
  .catch(response => checkResponse(t, response, 409))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument update', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, 'doc', doc))
  .then(response => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    let doc = response.data
    doc.baz = 42
    return db.createDocument(baseUrl, dbName, 'doc', doc)
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
  .then(response => db.createDocument(baseUrl, dbName, 'doc', doc))
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
  .then(response => db.createDocument(baseUrl, dbName, 'doc', doc))
  .then(response => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    let doc = response.data
    doc.baz = 42
    return db.createDocument(baseUrl, dbName, 'doc', doc)
  })
  .then(response => checkResponse(t, response, 201))
  .then(response => db.getDocument(baseUrl, dbName, 'doc', {rev: response.data.rev}))
  .then(response => checkResponse(t, response, 200))
  .then(response => t.deepEqual(response.data.baz, 42))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test.onFinish(function () {
  db.listDatabases(baseUrl)
  .then(response => console.error(util.inspect(response)))
  .catch(response => console.error(util.inspect(response)))
})
