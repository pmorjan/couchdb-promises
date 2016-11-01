
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/pmorjan/couchdb-promises.svg?branch=master)](https://travis-ci.org/pmorjan/couchdb-promises)
[![NPM Version](https://img.shields.io/npm/v/couchdb-promises.svg)](https://www.npmjs.com/package/couchdb-promises)

# couchdb-promises

### Yet another Node.js module for CouchDB that uses ES6 promises

*   **no dependencies**
*   **as simple as possible**

All Functions return a **Promise object** whose fulfillment or failure handler receives an object of **4** properties:
*   **headers**: {Object} - HTTP response headers
*   **data**: {Object} - DB response object
*   **status**: {Number} - HTTP status code
*   **message**: {String} - description of the status code

The promise is resolved if the **status** code is **< 400** otherwise rejected.

### Installation
```
npm install couchdb-promises
```

### [Example.js](examples/example.js)

```javascript
const db = require('couchdb-promises')
const baseUrl = 'http://localhost:5984'  // https://[user:password@]server[:port]
const dbName = 'testdb'
```

#### get info
```javascript
db.getInfo(baseUrl)
.then(console.log)
// { headers: { ... },
//   data:
//    { couchdb: 'Welcome',
//      uuid: 'bce82829daa02c49fe5b57c542ea95a3',
//      version: '1.6.1',
//      vendor: { name: 'The Apache Software Foundation', version: '1.6.1' } },
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### create database
```javascript
db.createDatabase(baseUrl, dbName)
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 201,
//   message: 'Created - Database created successfully' }
```

#### get database head
```javascript
.then(() => db.getDatabaseHead(baseUrl, dbName))
.then(console.log)
// { headers: { ... },
//   data: {},
//   status: 200,
//   message: 'OK - Database exists' }
```

#### list databases
```javascript
.then(() => db.listDatabases(baseUrl))
.then(console.log)
// { headers: { ... },
//   data: [ '_replicator', '_users', 'testdb' ],
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### create document
```javascript
.then(() => db.createDocument(baseUrl, dbName, {name: 'Bob'}))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'daae0752c6909d7ca4cd833f46014605',
//      rev: '1-5a26fa4b20e40bc9e2d3e47b168be460' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }
```

#### create document by id
```javascript
.then(() => db.createDocument(baseUrl, dbName, {name: 'Alice'}, 'doc2'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '1-88b10f13383b5d1e34d1d66d296f061f' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }
```

#### get document head
```javascript
.then(() => db.getDocumentHead(baseUrl, dbName, 'doc2'))
.then(console.log)
// { headers:
//    { server: 'CouchDB/1.6.1 (Erlang OTP/18)',
//      etag: '"1-88b10f13383b5d1e34d1d66d296f061f"',
//      date: 'Sat, 01 Oct 2016 09:46:09 GMT',
//      'content-type': 'application/json',
//      'content-length': '74',
//      'cache-control': 'must-revalidate' },
//   data: {},
//   status: 200,
//   message: 'OK - Document exists' }
```

#### get document
```javascript
.then(() => db.getDocument(baseUrl, dbName, 'doc2'))
.then(response => { console.log(response); return response.data })
// { headers: { ... },
//   data:
//    { _id: 'doc2',
//      _rev: '1-88b10f13383b5d1e34d1d66d296f061f',
//      name: 'Alice' },
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### update document
```javascript
.then((doc) => {
  doc.age = 42
  return db.createDocument(baseUrl, dbName, doc, 'doc2')
})
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '2-ee5ea9ac0bb1bec913a9b5e7bc11b113' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }
```

#### get all documents
```javascript
.then(() => db.getAllDocuments(baseUrl, dbName, {
  descending: true,
  include_docs: true
}))
.then(console.log)
// { headers: { ... },
//   data: { total_rows: 2, offset: 0, rows: [ [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### delete document
```javascript
.then(() => db.deleteDocument(baseUrl, dbName, 'doc2', '2-ee5ea9ac0bb1bec913a9b5e7bc11b113'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '3-ec0a86a95c5e98a5cd52c29b79b66372' },
//   status: 200,
//   message: 'OK - Document successfully removed' }
```

#### bulk create documents
```javascript
.then(() => db.createBulkDocuments(baseUrl, dbName, [
  {name: 'Tick'}, {name: 'Trick'}, {name: 'Track'}
], {all_or_nothing: true}))
.then(console.log)
// { headers: { ... },
//   data:
//   [ { ok: true,
//       id: '5413cf41edaedaec6b63aee93db86e1f',
//       rev: '1-d7f23e94e65978ea9252d753fe5dc3f6' },
//     { ok: true,
//       id: '5413cf41edaedaec6b63aee93db877cc',
//       rev: '1-646cd5f84634632f42fee2bdf4ff753a' },
//     { ok: true,
//       id: '5413cf41edaedaec6b63aee93db87c3d',
//       rev: '1-9cc8cf1e775b686ca337f69cd39ff772' } ],
//  status: 201,
//  message: 'Created – Document(s) have been created or updated' }
```

#### delete database
```javascript
.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }
```

#### get uuids
```javascript
.then(() => db.getUuids(baseUrl, 3))
.then(console.log)
// { headers: { ... },
//   data:
//    { uuids:
//       [ 'daae0752c6909d7ca4cd833f46014c47',
//         'daae0752c6909d7ca4cd833f460150c5',
//         'daae0752c6909d7ca4cd833f460156c5' ] },
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### on error
```javascript
.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.catch(console.error)
// { headers: { ... },
//   data: { error: 'not_found', reason: 'no_db_file' },
//   status: 404,
//   message: 'Not Found - Document not found' }
```

---

### [View.js](examples/view.js)

#### create design document
```javascript
const ddoc = {
  language: 'javascript',
  views: { view1: { map: 'function (doc) {emit(doc.name, doc.number)}' } }
}
const docId = 'ddoc1'

db.createDesignDocument(baseUrl, dbName, ddoc, docId)
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: '_design/ddoc1',
//      rev: '1-548c68d8cc2c1fac99964990a58f66fd' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }
```

#### get design document
```javascript
db.getDesignDocument(baseUrl, dbName, docId)
.then(console.log)
// { headers: { ... },
//   data:
//    { _id: '_design/ddoc1',
//      _rev: '1-548c68d8cc2c1fac99964990a58f66fd',
//      language: 'javascript',
//      views: { view1: [Object] } },
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### get design document info
```javascript
db.getDesignDocumentInfo(baseUrl, dbName, docId)
.then(console.log)
// { headers: { ... },
//   data:
//   { name: 'ddoc1',
//     view_index:
//      { updates_pending: [Object],
//        waiting_commit: false,
//        waiting_clients: 0,
//        updater_running: false,
//        update_seq: 0,
//        sizes: [Object],
//        signature: '09da8e42090600707a71a85434663e4f',
//        purge_seq: 0,
//        language: 'javascript',
//        disk_size: 408,
//        data_size: 0,
//        compact_running: false } },
//  status: 200,
//  message: 'OK - Request completed successfully' }
```

#### delete design document
```javascript
db.deleteDesignDocument(baseUrl, dbName, docId, rev)
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: '_design/ddoc1',
//      rev: '2-fd68157ec3c1915ebe0b248343292d34' },
//   status: 200,
//   message: 'OK - Document successfully removed' }
```

#### get view
```javascript
db.getView(baseUrl, dbName, docId, viewName, {limit: 3})
.then(console.log)
// { headers: { ... },
//   data:
//    { total_rows: 12,
//      offset: 0,
//      rows: [ [Object], [Object], [Object] ] },
//   status: 200,
//   message: 'OK' }
```

---

#### get request timeout
```javascript
db.getTimeout()
// -> 10000  (returns Number)
```

#### set request timeout
```javascript
db.setTimeout(3000)
// -> 3000  (returns Number)
```

---

# API Reference

See [examples](examples/) for details.

### database functions
*   createDatabase()
*   deleteDatabase()
*   getDatabase()
*   getDatabaseHead()
*   listDatabases()

### document functions
*   getAllDocuments()
*   createDocument()
*   deleteDocument()
*   getDocument()
*   getDocumentHead()

### document attachment functions
*   getAttachment()
*   getAttachmentHead()
*   addAttachment()
*   deleteAttachment()

### view and design document functions
*   createDesignDocument()
*   deleteDesignDocument()
*   getDesignDocument()
*   getDesignDocumentInfo()
*   getView()

### bulk document functions
*   createBulkDocuments()

### miscellaneous functions
*   setTimeout()
*   getTimeout()
*   getInfo()
*   getUuids()

### aliases for backward compatibility
*   bulkDocs() -> createBulkDocuments()
*   getAllDocs() -> getAllDocuments()
