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

let couchVersion = ''

function getName () {
  // return uniq DB name e.g. testdb_1478345689284_16
  if (!getName.prefix) {
    getName.prefix = `testdb_${Date.now()}`
    getName.count = 0
  }
  return `${getName.prefix}_${getName.count++}`
}

function checkResponse (t, response, status) {
  t.test(t.name, function (ts) {
    // this will only fire when t finishes
    ts.plan(7)
    ts.equal(Object.prototype.toString.call(response), '[object Object]', 'response is real object')
    ts.equal(typeof response.headers, 'object', `type of response.headers is 'object'`)
    ts.equal(typeof response.data, 'object', `type of response.data is 'object'`)
    ts.true(typeof response.message === 'string' && response.message, `type of response.message is 'string'`)
    ts.true(typeof response.duration === 'number' && response.duration >= 0, `type of response.duration is 'number'`)
    if (Object.prototype.toString.call(status) === '[object Array]') {
      ts.true(status.indexOf(response.status) > -1, `response.status is in [${status}], actual: ${response.status}`)
    } else {
      ts.equal(response.status, status, `response.status is ${status}, actual: ${response.status}`)
    }
    ts.pass(response.message.slice(0, 70))
  })
  return response
}

test('url does not belong to a couchdb server', function (t) {
  t.plan(1)
  db.listDatabases('http://www.google.com:80')
  .catch(response => checkResponse(t, response, 500))
})

test('invalid url', function (t) {
  t.plan(3)
  // invalid protocol ftp://...
  db.listDatabases('f' + baseUrl.slice(2))
  .catch(response => checkResponse(t, response, 400))
  // no port
  .then(() => db.listDatabases(baseUrl.substr(0, baseUrl.lastIndexOf(':'))))
  .catch(response => checkResponse(t, response, 400))
  // invalid port
  .then(() => db.listDatabases(baseUrl.substr(0, baseUrl.lastIndexOf(':')) + 'abc'))
  .catch(response => checkResponse(t, response, 400))
})

test('getUrl()', function (t) {
  t.plan(1)
  db.getUrl(`${baseUrl}/`)
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('getInfo()', function (t) {
  t.plan(1)
  db.getInfo(baseUrl)
  .then(response => checkResponse(t, response, 200))
  .then(response => { couchVersion = response.data.version })
  .catch(response => console.error(util.inspect(response)))
})

test('getUuids()', function (t) {
  t.plan(13)
  db.getUuids(baseUrl, 10)
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(Array.isArray(response.data.uuids), 'object is Array')
    t.equal(response.data.uuids.length, 10, 'array contains 10 elements')
    response.data.uuids.forEach(uid => {
      t.true(uid.match(/^[a-f0-9]{32}$/), 'array element is uid')
    })
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
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase() with special name', function (t) {
  t.plan(1)
  const dbName = getName() + '_$()+-/'
  db.createDatabase(baseUrl, dbName)
  .then(response => checkResponse(t, response, 201))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase() with error', function (t) {
  t.plan(2)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDatabase(baseUrl, '%123'))   // invalid dbName
  .catch(response => checkResponse(t, response, 400))
  .then(() => db.createDatabase(baseUrl, dbName))   // db alredy exists
  .catch(response => checkResponse(t, response, 412))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.getDatabase(baseUrl, dbName))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDatabase() with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.getDatabase(baseUrl, dbName)
  .catch(response => checkResponse(t, response, 404))
})

test('getDatabaseHead()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.getDatabase(baseUrl, dbName))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDatabaseHead() with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.getDatabaseHead(baseUrl, dbName)
  .catch(response => checkResponse(t, response, 404))
})

test('deleteDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.deleteDatabase(baseUrl, dbName))
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
  .then(() => db.createDocument(baseUrl, dbName, doc))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId special name', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  const docName = '`~!@#$%^&*()_+-=[]{}|;:\'",./<> ?'
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, docName))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with invalid document', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, null, 'doc'))
  .catch(response => checkResponse(t, response, 400))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId with error', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc')) // conflict
  .catch(response => checkResponse(t, response, 409))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() update', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(() => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    const doc = response.data
    doc.baz = 42
    return db.createDocument(baseUrl, dbName, doc, 'doc')
  })
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDocument()', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(() => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDocument(baseUrl, dbName, 'doc', response.data._rev))
  .then(response => checkResponse(t, response, [200, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getAllDocuments()', function (t) {
  t.plan(3)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, {foo: 1}, 'doc1'))
  .then(() => db.createDocument(baseUrl, dbName, {bar: 2}, 'doc2'))
  .then(() => db.getAllDocuments(baseUrl, dbName, {
    include_docs: true,
    descending: true
  }))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows === 2, 'total_rows is ok')
    t.equal(response.data.rows[0].id, 'doc2', 'query paramter decending ok')
  })
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocument()', function (t) {
  t.plan(4)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(() => db.getDocument(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    const doc = response.data
    doc.baz = 42
    return db.createDocument(baseUrl, dbName, doc, 'doc')
  })
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.getDocument(baseUrl, dbName, 'doc', {rev: response.data.rev}))
  .then(response => checkResponse(t, response, 200))
  .then(response => t.equal(response.data.baz, 42), 'doc constains new property')
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocumentHead()', function (t) {
  t.plan(3)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getDocumentHead(baseUrl, dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.getDocumentHead(baseUrl, dbName, 'doc', {rev: '1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}))
  .catch(response => checkResponse(t, response, 404))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('findDocuments()', function (t) {
  if (!couchVersion.match(/^2\./)) {
    t.comment(`couchVersion: ${couchVersion} -> ${t.name} skipped`)
    t.end()
    return
  }
  t.plan(4)
  const dbName = getName()
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createBulkDocuments(baseUrl, dbName, [
    {x: 1, y: 'a', _id: 'doc1'},
    {x: 2, y: 'b', _id: 'doc2'},
    {x: 3, y: 'c', _id: 'doc3'}
  ]))
  .then(() => db.findDocuments(baseUrl, dbName, {
    selector: {
      x: { $gt: 1 }
    },
    fields: ['_id', 'y']
  }))
  .then(response => checkResponse(t, response, 200))
  // .then(response => { console.log(response.data.docs); return response })
  .then(response => {
    t.true(Array.isArray(response.data.docs), 'response.data.docs is array')
    t.true(response.data.docs.length === 2, 'doc array has 2 elements')
    t.equal(response.data.docs[0]._id, 'doc2', 'first doc is doc2')
  })
  .then(() => db.deleteDatabase(baseUrl, dbName))
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
  .then(() => db.createDocument(baseUrl, dbName, {foo: 'bar'}, 'doc1'))
  .then(() => db.createDocument(baseUrl, dbName, {foo: 'baz'}, 'doc2'))
  .then(() => db.createDesignDocument(baseUrl, dbName, ddoc, docId))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getView(baseUrl, dbName, docId, 'all', {descending: true}))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows, 2, 'number of rows returned')
    t.equal(response.data.rows[0].value, 'baz', 'row order')
    return response
  })
  .then(() => db.getDesignDocumentInfo(baseUrl, dbName, docId))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.getDesignDocument(baseUrl, dbName, docId))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDesignDocument(baseUrl, dbName, docId, response.data._rev))
  .then(response => checkResponse(t, response, [200, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getTimeout()', function (t) {
  t.plan(1)
  const curTimeout = db.getTimeout()
  t.true(typeof curTimeout === 'number', 'getTimeout() returns number')
})

test('setTimeout()', function (t) {
  // create an http server to simulate a couchdb server that does
  // not response within a given time frame.
  // no http request handler -> connecting works but no response
  t.plan(2)
  const timeout = 1000
  const eps = 100
  const server = http.createServer().listen(0)
  server.on('listening', function () {
    const port = server.address().port
    const oldTimeout = db.getTimeout()
    t.timeoutAfter(timeout + (2 * eps))
    db.setTimeout(timeout)
    const t0 = Date.now()
    db.getInfo(`http://localhost:${port}`)
    .catch(response => checkResponse(t, response, 500))
    .then(() => t.true(Date.now() - t0 < timeout + eps, 'time difference is ok'))
    .then(() => {
      server.close()
      db.setTimeout(oldTimeout)
    })
  })
})

test('createBulkDocuments())', function (t) {
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
  .then(() => db.createBulkDocuments(baseUrl, dbName, docs, {all_or_nothing: false}))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getAllDocuments(baseUrl, dbName, { limit: 1 }))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows === cnt, `total_rows is ${cnt}`)
  })
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .then(() => db.setTimeout(oldTimeout))
  .catch(response => console.error(util.inspect(response)))
})

test('add/get/delete Attachment', function (t) {
  t.plan(4)
  const dbName = getName()
  const doc = {foo: 'bar'}
  const a1 = {
    name: 'hello.txt',
    data: `hello\nworld`,
    contentType: 'text/plain'
  }
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createDocument(baseUrl, dbName, doc, 'doc'))
  // add
  .then(response => {
    const rev = response.data.rev
    return db.addAttachment(baseUrl, dbName, 'doc', a1.name, rev, a1.contentType, a1.data)
  })
  .then(response => checkResponse(t, response, [201, 202]))
  // get as base64
  .then(() => db.getDocument(baseUrl, dbName, 'doc', {attachments: true}))
  .then(response => checkResponse(t, response, 200))
  // check retrieved attachment
  .then(response => {
    const base64 = response.data._attachments[a1.name].data
    const a2 = Buffer.from(base64, 'base64').toString('utf8')
    t.equal(a1.data, a2, 'sent attachment ===  retrieved attachment')
    return response
  })
  // delete
  .then(response => {
    const rev = response.data._rev
    return db.deleteAttachment(baseUrl, dbName, 'doc', a1.name, rev)
  })
  .then(response => checkResponse(t, response, [200, 202]))
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createIndex() getIndex() deleteIndex()', function (t) {
  if (!couchVersion.match(/^2\./)) {
    t.comment(`couchVersion: ${couchVersion} -> ${t.name} skipped`)
    t.end()
    return
  }
  t.plan(3)
  const dbName = getName()
  const indexObj = {
    index: {
      fields: ['foo']
    },
    name: 'foo-index'
  }
  db.createDatabase(baseUrl, dbName)
  .then(() => db.createIndex(baseUrl, dbName, indexObj))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.getIndex(baseUrl, dbName))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    const docId = response.data.indexes.find(e => e.name === 'foo-index').ddoc
    return db.deleteIndex(baseUrl, dbName, docId, 'foo-index')
      .then(response2 => checkResponse(t, response2, 200))
  })
  .then(() => db.deleteDatabase(baseUrl, dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('aliases', function (t) {
  t.plan(2)
  t.equal(db.bulkDocs, db.createBulkDocuments, 'alias bulkDocs')
  t.equal(db.getAllDocs, db.getAllDocuments, 'alias getAllDocs')
})

test('db server is clean', function (t) {
  // no leftover databases
  t.plan(1)
  const re = new RegExp('^' + getName.prefix)
  db.listDatabases(baseUrl)
  .then(response => response.data.find(e => re.test(e)) ? Promise.reject() : Promise.resolve())
  .catch(() => new Promise(function (resolve, reject) {
    // sleep 1 sec and try again
    setTimeout(() => resolve(), 1000)
  }))
  .then(() => db.listDatabases(baseUrl))
  .then(response => t.deepEqual(response.data.filter(e => re.test(e)), [], `all ${getName.count} temporary databases removed`))
  .catch(response => console.error(util.inspect(response)))
})

test.onFinish(() => console.log(`\n# CouchDB version: ${couchVersion}`))
