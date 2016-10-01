// http://docs.couchdb.org/en/stable/api/index.html
// https://github.com/substack/tape#methods
'use strict'
const crypto = require('crypto')
const http = require('http')
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
  t.test(t.name, function (ts) {
    // this will only fire when t finishes
    ts.plan(7)
    ts.equal(Object.prototype.toString.call(response), '[object Object]', 'response is real object')
    ts.equal(typeof response.headers, 'object', 'type of response.headers is \'object\'')
    ts.equal(typeof response.data, 'object', 'type of response.data is \'object\'')
    ts.equal(typeof response.message, 'string', 'type of response.message is \'string\'')
    ts.true(response.message, 'response.message is not empty')
    if (Object.prototype.toString.call(status) === '[object Array]') {
      ts.true(status.indexOf(response.status) > -1, 'response.status is in [' + status + '], actual:' + response.status)
    } else {
      ts.equal(response.status, status, 'response.status is ' + status + ', actual:' + response.status)
    }
    ts.pass(response.message)
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

test('getInfo()', function (t) {
  t.plan(1)
  db.getInfo(baseUrl)
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('getUuids()', function (t) {
  t.plan(4)
  db.getUuids(baseUrl, 10)
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.equal(Object.prototype.toString.call(response.data.uuids), '[object Array]', 'object is Array')
    t.equal(response.data.uuids.length, 10, 'array contains 10 elements')
    t.true(response.data.uuids[0].match(/^[a-z0-9]+$/), 'first element looks like a UUID')
  })
  .catch(response => console.error(util.inspect(response)))
})

test('listDatabases()', function (t) {
  t.plan(1)
  db.listDatabases(baseUrl)
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase() with special name', function (t) {
  t.plan(1)
  const dbName = getName() + '_$()+-/'
  db.createDatabase(baseUrl, dbName)
  .then(response => checkResponse(t, response, 201))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase() with error', function (t) {
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

test('deleteDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDatabase() with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.deleteDatabase(baseUrl, dbName)
  .catch(response => checkResponse(t, response, 404))   // not found
})

test('createDocument() without docId', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId special name', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'a_$() : + -/'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId with error', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc')) // conflict
  .catch(response => checkResponse(t, response, 409))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() update', function (t) {
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
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDocument()', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDocument(baseUrl, dbName, 'doc', response.data._rev))
  .then(response => checkResponse(t, response, [200, 202]))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getAllDocs()', function (t) {
  t.plan(3)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, {foo: 1}, 'doc1'))
  .then(response => db.createDocument(baseUrl, dbName, {bar: 2}, 'doc2'))
  .then(() => db.getAllDocs(baseUrl, dbName, {
    include_docs: true,
    descending: true
  }))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows === 2, 'total_rows is ok')
    t.equal(response.data.rows[0].id, 'doc2', 'query paramter decending ok')
  })
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocument()', function (t) {
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
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.getDocument(baseUrl, dbName, 'doc', {rev: response.data.rev}))
  .then(response => checkResponse(t, response, 200))
  .then(response => t.equal(response.data.baz, 42), 'doc constains new property')
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocumentHead()', function (t) {
  t.plan(3)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.getDocumentHead(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.getDocumentHead(baseUrl, dbName, 'doc', {rev: '1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}))
  .catch(response => checkResponse(t, response, 404))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('[create|delete|get]DesignDocument(), getDesignDocumentInfo(), getView()', function (t) {
  t.plan(7)
  const dbName = getName()
  const docId = 'doc1'
  const ddoc = {
    language: 'javascript',
    views: { all: { map: 'function (doc) {emit(null, doc.foo)}' } }
  }
  db.createDatabase(baseUrl, dbName)
  .then(response => db.createDocument(baseUrl, dbName, {foo: 'bar'}, 'doc1'))
  .then(response => db.createDocument(baseUrl, dbName, {foo: 'baz'}, 'doc2'))
  .then(response => db.createDesignDocument(baseUrl, dbName, ddoc, docId))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.getView(baseUrl, dbName, docId, 'all', {descending: true}))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows, 2, 'number of rows returned')
    t.equal(response.data.rows[0].value, 'baz', 'row order')
    return response
  })
  .then(response => db.getDesignDocumentInfo(baseUrl, dbName, docId))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.getDesignDocument(baseUrl, dbName, docId))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDesignDocument(baseUrl, dbName, docId, response.data._rev))
  .then(response => checkResponse(t, response, [200, 202]))
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getTimeout()', function (t) {
  t.plan(1)
  const curTimeout = db.getTimeout()
  t.true(typeof curTimeout === 'number', 'getTimeout() returns number')
})

test('setTimeout()', function (t) {
  const timeout = 1000
  const eps = 100
  const port = 47474
  const server = http.createServer().listen(port)
  t.plan(2)
  const oldTimeout = db.getTimeout()
  t.timeoutAfter(timeout + 2 * eps)
  db.setTimeout(timeout)
  const t0 = Date.now()
  db.getInfo('http://localhost:' + port)
  .catch(response => checkResponse(t, response, 500))
  .then(() => t.true(Date.now() - t0 < timeout + eps, 'time difference is ok'))
  .then(() => {
    server.close()
    db.setTimeout(oldTimeout)
  })
})

test('bulkDocs())', function (t) {
  function randomData () {
    return crypto.randomBytes(Math.floor(Math.random() * 1000)).toString('hex')
  }
  t.plan(3)
  const cnt = 1000
  const dbName = getName()
  const docs = new Array(cnt).fill().map((x, i) => {
    return { n: i, value: randomData() }
  })
  const oldTimeout = db.getTimeout()
  db.setTimeout(60000)
  db.createDatabase(baseUrl, dbName)
  .then(() => db.bulkDocs(baseUrl, dbName, docs, {all_or_nothing: false}))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getAllDocs(baseUrl, dbName, { limit: 1 }))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows === cnt, 'total_rows is ' + cnt)
  })
  .then(response => db.deleteDatabase(baseUrl, dbName))
  .then(() => db.setTimeout(oldTimeout))
  .catch(response => console.error(util.inspect(response)))
})

test('db server is clean', function (t) {
  t.plan(1)
  const re = new RegExp('^' + prefix)
  db.listDatabases(baseUrl)
  .then(response => response.data.find(e => re.test(e)) ? Promise.reject() : Promise.resolve())
  .catch(() => new Promise(function (resolve, reject) {
    // sleep 1 sec and try again
    setTimeout(() => resolve(), 1000)
  }))
  .then(() => db.listDatabases(baseUrl))
  .then(response => t.false(response.data.find(e => re.test(e)), 'all tempdb deleted'))
})
