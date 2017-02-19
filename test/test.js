// http://docs.couchdb.org/en/stable/api/index.html
// https://github.com/substack/tape#methods
'use strict'
const crypto = require('crypto')
const http = require('http')
const https = require('https')
const util = require('util')
//
const test = require('tape')
const couchdb = require('../index')
const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const db = couchdb({
  baseUrl: baseUrl,
  requestTimeout: 5000
})

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
    ts.pass(`response message: '${response.message.slice(0, 60)}'`)
  })
  return response
}

test('options object', function (t) {
  t.plan(3)
  t.throws(() => couchdb({baseUrl: 42}), /baseUrl/, 'throws on invalid baseUrl')
  t.throws(() => couchdb({baseUrl: baseUrl, requestTimeout: 'a'}), /requestTimeout/, 'throws on invalid requestTimeout')
  t.throws(() => couchdb({baseUrl: baseUrl, verifyCertificate: 42}), /verifyCertificate/, 'throws on invalid verifyCertificate')
})

test('getUrlPath()', function (t) {
  t.plan(1)
  db.getUrlPath('_all_dbs')
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('getInfo()', function (t) {
  t.plan(1)
  db.getInfo('')
  .then(response => checkResponse(t, response, 200))
  .then(response => { couchVersion = response.data.version })
  .catch(response => console.error(util.inspect(response)))
})

test('getUuids()', function (t) {
  t.plan(13)
  db.getUuids(10)
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
  db.listDatabases()
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(response => checkResponse(t, response, 201))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase() with special name', function (t) {
  t.plan(1)
  const dbName = getName() + '_$()+-/'
  db.createDatabase(dbName)
  .then(response => checkResponse(t, response, 201))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDatabase() with error', function (t) {
  t.plan(2)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(() => db.createDatabase('%123'))   // invalid dbName
  .catch(response => checkResponse(t, response, 400))
  .then(() => db.createDatabase(dbName))   // db alredy exists
  .catch(response => checkResponse(t, response, 412))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(() => db.getDatabase(dbName))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDatabase() with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.getDatabase(dbName)
  .catch(response => checkResponse(t, response, 404))
})

test('getDatabaseHead()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(() => db.getDatabase(dbName))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDatabaseHead() with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.getDatabaseHead(dbName)
  .catch(response => checkResponse(t, response, 404))
})

test('deleteDatabase()', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(() => db.deleteDatabase(dbName))
  .then(response => checkResponse(t, response, 200))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDatabase() with error', function (t) {
  t.plan(1)
  const dbName = getName()
  db.deleteDatabase(dbName)
  .catch(response => checkResponse(t, response, 404))   // not found
})

test('copyDocument() to new doc', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.copyDocument(dbName, 'doc', 'doc2'))
  .then(response => checkResponse(t, response, 201))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('copyDocument() to existing doc with error', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.copyDocument(dbName, 'doc', 'doc2'))
  .then(response => checkResponse(t, response, 201))
  .then(() => db.copyDocument(dbName, 'doc', 'doc2'))
  .catch(response => checkResponse(t, response, 409))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() without docId', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId special name', function (t) {
  t.plan(1)
  const dbName = getName()
  const doc = {foo: 'bar'}
  const docName = '`~!@#$%^&*()_+-=[]{}|;:\'",./<> ?'
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, docName))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with invalid document', function (t) {
  t.plan(1)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, null, 'doc'))
  .catch(response => checkResponse(t, response, 400))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() with docId with error', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.createDocument(dbName, doc, 'doc')) // conflict
  .catch(response => checkResponse(t, response, 409))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createDocument() update', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(() => db.getDocument(dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    const doc = response.data
    doc.baz = 42
    return db.createDocument(dbName, doc, 'doc')
  })
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('deleteDocument()', function (t) {
  t.plan(2)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(() => db.getDocument(dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDocument(dbName, 'doc', response.data._rev))
  .then(response => checkResponse(t, response, [200, 202]))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getAllDocuments()', function (t) {
  t.plan(3)
  const dbName = getName()
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, {foo: 1}, 'doc1'))
  .then(() => db.createDocument(dbName, {bar: 2}, 'doc2'))
  .then(() => db.getAllDocuments(dbName, {
    include_docs: true,
    descending: true
  }))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows === 2, 'total_rows is ok')
    t.equal(response.data.rows[0].id, 'doc2', 'query paramter decending ok')
  })
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocument()', function (t) {
  t.plan(4)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(() => db.getDocument(dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    const doc = response.data
    doc.baz = 42
    return db.createDocument(dbName, doc, 'doc')
  })
  .then(response => checkResponse(t, response, [201, 202]))
  .then(response => db.getDocument(dbName, 'doc', {rev: response.data.rev}))
  .then(response => checkResponse(t, response, 200))
  .then(response => t.equal(response.data.baz, 42), 'doc constains new property')
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('getDocumentHead()', function (t) {
  t.plan(3)
  const dbName = getName()
  const doc = {foo: 'bar'}
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getDocumentHead(dbName, 'doc'))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.getDocumentHead(dbName, 'doc', {rev: '1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}))
  .catch(response => checkResponse(t, response, 404))
  .then(() => db.deleteDatabase(dbName))
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
  db.createDatabase(dbName)
  .then(() => db.createBulkDocuments(dbName, [
    {x: 1, y: 'a', _id: 'doc1'},
    {x: 2, y: 'b', _id: 'doc2'},
    {x: 3, y: 'c', _id: 'doc3'}
  ]))
  .then(() => db.findDocuments(dbName, {
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
  .then(() => db.deleteDatabase(dbName))
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
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, {foo: 'bar'}, 'doc1'))
  .then(() => db.createDocument(dbName, {foo: 'baz'}, 'doc2'))
  .then(() => db.createDesignDocument(dbName, ddoc, docId))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getView(dbName, docId, 'all', {descending: true}))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows, 2, 'number of rows returned')
    t.equal(response.data.rows[0].value, 'baz', 'row order')
    return response
  })
  .then(() => db.getDesignDocumentInfo(dbName, docId))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.getDesignDocument(dbName, docId))
  .then(response => checkResponse(t, response, 200))
  .then(response => db.deleteDesignDocument(dbName, docId, response.data._rev))
  .then(response => checkResponse(t, response, [200, 202]))
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('createBulkDocuments())', function (t) {
  const db = couchdb({
    baseUrl: baseUrl,
    requestTimeout: 60000
  })
  function randomData () {
    return crypto.randomBytes(Math.floor(Math.random() * 1000)).toString('hex')
  }
  t.plan(3)
  const cnt = 1000
  const dbName = getName()
  const docs = new Array(cnt).fill().map((x, i) => {
    return { n: i, value: randomData() }
  })
  db.createDatabase(dbName)
  .then(() => db.createBulkDocuments(dbName, docs, {all_or_nothing: false}))
  .then(response => checkResponse(t, response, [201, 202]))
  .then(() => db.getAllDocuments(dbName, { limit: 1 }))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    t.true(response.data.total_rows === cnt, `total_rows is ${cnt}`)
  })
  .then(() => db.deleteDatabase(dbName))
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
  db.createDatabase(dbName)
  .then(() => db.createDocument(dbName, doc, 'doc'))
  // add
  .then(response => {
    const rev = response.data.rev
    return db.addAttachment(dbName, 'doc', a1.name, rev, a1.contentType, a1.data)
  })
  .then(response => checkResponse(t, response, [201, 202]))
  // get as base64
  .then(() => db.getDocument(dbName, 'doc', {attachments: true}))
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
    return db.deleteAttachment(dbName, 'doc', a1.name, rev)
  })
  .then(response => checkResponse(t, response, [200, 202]))
  .then(() => db.deleteDatabase(dbName))
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
  db.createDatabase(dbName)
  .then(() => db.createIndex(dbName, indexObj))
  .then(response => checkResponse(t, response, 200))
  .then(() => db.getIndex(dbName))
  .then(response => checkResponse(t, response, 200))
  .then(response => {
    const docId = response.data.indexes.find(e => e.name === 'foo-index').ddoc
    return db.deleteIndex(dbName, docId, 'foo-index')
      .then(response2 => checkResponse(t, response2, 200))
  })
  .then(() => db.deleteDatabase(dbName))
  .catch(response => console.error(util.inspect(response)))
})

test('db server is clean', function (t) {
  // no leftover databases
  t.plan(1)
  const re = new RegExp('^' + getName.prefix)
  db.listDatabases()
  .then(response => response.data.find(e => re.test(e)) ? Promise.reject() : Promise.resolve())
  .catch(() => new Promise(function (resolve, reject) {
    // sleep 1 sec and try again
    setTimeout(() => resolve(), 1000)
  }))
  .then(() => db.listDatabases())
  .then(response => t.deepEqual(response.data.filter(e => re.test(e)), [], `all ${getName.count} temporary databases removed`))
  .catch(response => console.error(util.inspect(response)))
})

test('requestTimeout', function (t) {
  // create an http server to simulate a couchdb server that does
  // not response within a given time frame.
  // no http request handler -> connecting works but no response
  t.plan(2)
  const timeout = 3000
  const eps = 100
  const server = http.createServer().listen(0)

  server.on('listening', function () {
    t.timeoutAfter(timeout + (2 * eps))
    const port = server.address().port
    const t0 = Date.now()
    const db = couchdb({
      baseUrl: `http://localhost:${port}`,
      requestTimeout: timeout
    })
    db.getInfo()
    .catch(response => checkResponse(t, response, 500))
    .then(() => t.true(Date.now() - t0 < timeout + eps, 'time difference is ok'))
    .then(() => server.close())
  })
})

test('verifyCertificate true/false', function (t) {
  // create an https server to simulate a couchdb server
  // use self signed certificates
  const cert = `
-----BEGIN CERTIFICATE-----
MIICSjCCAbOgAwIBAgIFCVOQGEEwDQYJKoZIhvcNAQELBQAwaTEUMBIGA1UEAxMLZXhhbXBsZS5vcmcxCzAJBgNVBAYTAlVTMREwDwYDVQQIEwhWaXJnaW5pYTETMBEGA1UEBxMKQmxhY2tzYnVyZzENMAsGA1UEChMEVGVzdDENMAsGA1UECxMEVGVzdDAeFw0xNjExMjYyMTI1MjZaFw0xNzExMjYyMTI1MjZaMGkxFDASBgNVBAMTC2V4YW1wbGUub3JnMQswCQYDVQQGEwJVUzERMA8GA1UECBMIVmlyZ2luaWExEzARBgNVBAcTCkJsYWNrc2J1cmcxDTALBgNVBAoTBFRlc3QxDTALBgNVBAsTBFRlc3QwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBALssy8NcUbjA4zhxAWE/jAIlHIBUIPOqVpokhBKq4pOEEXnc+zJMZbakaH1JMsIWgYhvSlitgYACPwa/qPQZ++gmxjtipWPmuv0sGYRpvm4mhGKkS4RG+DQtr0n9CXZnyWOtoxHdcrqzex/itNGZyL6jY0BXnkwwlw87y2hVuls5AgMBAAEwDQYJKoZIhvcNAQELBQADgYEANbUZ1LNLEONFm4e3iMy6ilDjTHn1Nnrx8oqbA+YMAwsXnlz1sZbN4VAyBd8X3BdEuU0GoVpGna8fToMB9CvLmRqL6pgku+Ki6raUsrqs96PL5LhNI1zC10Rfnf8bLc3KIgLbgSmKBrz+tREgPGAmLSCo2wpnGHkis7jeyr5vBBs=
-----END CERTIFICATE-----
`
  const key = `
-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC7LMvDXFG4wOM4cQFhP4wCJRyAVCDzqlaaJIQSquKThBF53PsyTGW2pGh9STLCFoGIb0pYrYGAAj8Gv6j0GfvoJsY7YqVj5rr9LBmEab5uJoRipEuERvg0La9J/Ql2Z8ljraMR3XK6s3sf4rTRmci+o2NAV55MMJcPO8toVbpbOQIDAQABAoGAKl0ELU5KzMcTZmXlSw5n8OBXaBAieSPXgAG9xr/Ykky06+EBFaxG5SSm5ZxYmacgYDHYIOP8SG25uBxO8Bilc8125pmgjG9WZgpLOQwXxKHge+R9Q5tvYfeh930PahIRMRVxvU3UPhntW8M8JPEDD44DqS/49XS0I10GJmV7L1ECQQDoYK4e15afr/IzgP5EqinlUoDGL9SP9s9UlYfIT6r+HYmLeV9LAIlfibMQMe/nC9bB5KsDnxDfPtDhAhplCaj9AkEAzjPGukQO5cIQ6dXAnLza/9EDNkxJGWGAV1DCp3s2PI1e01Ph5zZBB852zg9h8hy79LMmclF2avJP1cOIYold7QJBAN+rV022g3O3HjC244diJqtlqy+YEEh17wBiYWzMSjEIa0EFlVSS8qcz2lgnSNwiSBcfLABzVgEb7F/370H7d10CQBdxhYeJ01PF45xiQ/rN8ewhvEbBF5J+JlRHB0p5VKo/vGc0YzuhTHVxwMoer5kSMUBZ2eYnYto34GHCUFA7o+UCQDeroZCW20YfhnT8T1YvbUQToqR4zN0lTLJbydndxDsK4b507XqGTX/DCi+I+vS4ClgViR/ruFk4EvLWkLz+N0I=
-----END RSA PRIVATE KEY-----
`
  t.plan(2)

  const server = https.createServer({
    key: key,
    cert: cert
  }, function (req, res) {
    const msg = JSON.stringify({ msg: 'hello test' })
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-length': msg.length
    })
    res.end(msg)
  }).listen(0)

  server.on('listening', function () {
    const port = server.address().port
    const db1 = couchdb({
      baseUrl: `https://localhost:${port}`,
      verifyCertificate: false
    })
    const db2 = couchdb({
      baseUrl: `https://localhost:${port}`
      // default verifyCertificate: true
    })

    // verifyCertificate: false
    db1.getInfo()
    .then(response => checkResponse(t, response, 200))
    // verifyCertificate: true
    .then(() => db2.getInfo())
    .catch(response => checkResponse(t, response, 500))
    .then(() => server.close())
  })
})

test.onFinish(() => console.log(`\n# CouchDB version: ${couchVersion}`))
