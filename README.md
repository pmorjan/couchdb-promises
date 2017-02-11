
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/pmorjan/couchdb-promises.svg?branch=master)](https://travis-ci.org/pmorjan/couchdb-promises)
[![NPM Version](https://img.shields.io/npm/v/couchdb-promises.svg)](https://www.npmjs.com/package/couchdb-promises)

# couchdb-promises

### Yet another Node.js module for CouchDB that uses ES6 promises

*   **no dependencies**
*   **as simple as possible**

All Functions return a [**Promise object**](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) whose fulfillment or failure handler receives an object of **5** properties:
*   **headers**: {Object} - HTTP response headers from CouchDB
*   **data**: {Object} - CouchDB response body
*   **status**: {Number} - HTTP status code from CouchDB
*   **message**: {String} - description of the status code from CouchDB API
*   **duration**: {Number} - execution time in milliseconds

The promise is resolved if the [**CouchDB status code**](http://docs.couchdb.org/en/latest/api/basics.html?highlight=status%20codes#http-status-codes) is **< 400** otherwise rejected.

### Installation
```
npm install couchdb-promises
```

### [Example.js](examples/example.js)

```javascript
const db = require('couchdb-promises')({
  baseUrl: 'http://localhost:5984', // required
  requestTimeout: 10000
})
const dbName = 'testdb'
```

#### get info
```javascript
db.getInfo()
.then(console.log)
// { headers: { ... },
//   data:
//    { couchdb: 'Welcome',
//      version: '2.0.0',
//      vendor: { name: 'The Apache Software Foundation' } },
//   status: 200,
//   message: 'OK - Request completed successfully'
//   duration: 36 }
```

#### create database
```javascript
db.createDatabase(dbName)
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 201,
//   message: 'Created - Database created successfully',
//   duration: 131 }
```

#### get database head
```javascript
.then(() => db.getDatabaseHead(dbName))
.then(console.log)
// { headers: { ... },
//   data: {},
//   status: 200,
//   message: 'OK - Database exists',
//   duration: 4 }
```

#### list databases
```javascript
.then(() => db.listDatabases())
.then(console.log)
// { headers: { ... },
//   data: [ '_replicator', '_users', 'testdb' ],
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 4 }
```

#### create document
```javascript
.then(() => db.createDocument(dbName, {name: 'Bob'}))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'daae0752c6909d7ca4cd833f46014605',
//      rev: '1-5a26fa4b20e40bc9e2d3e47b168be460' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 42 }
```

#### create document by id
```javascript
.then(() => db.createDocument(dbName, {name: 'Alice'}, 'doc2'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '1-88b10f13383b5d1e34d1d66d296f061f' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 38 }
```

#### get document head
```javascript
.then(() => db.getDocumentHead(dbName, 'doc2'))
.then(console.log)
// { 'cache-control': 'must-revalidate',
//   connection: 'close',
//   'content-length': '74',
//   'content-type': 'application/json',
//   date: 'Sun, 06 Nov 2016 08:56:47 GMT',
//   etag: '"1-88b10f13383b5d1e34d1d66d296f061f"',
//   server: 'CouchDB/2.0.0 (Erlang OTP/17)',
//   'x-couch-request-id': '041e46071b',
//   'x-couchdb-body-time': '0' },
//   data: {},
//   status: 200,
//   message: 'OK - Document exists',
//   duration: 6 }
```

#### get document
```javascript
.then(() => db.getDocument(dbName, 'doc2'))
.then(response => { console.log(response); return response.data })
// { headers: { ... },
//   data:
//    { _id: 'doc2',
//      _rev: '1-88b10f13383b5d1e34d1d66d296f061f',
//      name: 'Alice' },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 11 }
```

#### update document
```javascript
.then((doc) => {
  doc.age = 42
  return db.createDocument(dbName, doc, 'doc2')
})
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '2-ee5ea9ac0bb1bec913a9b5e7bc11b113' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 36 }
```

#### get all documents
```javascript
.then(() => db.getAllDocuments(dbName, {
  descending: true,
  include_docs: true
}))
.then(console.log)
// { headers: { ... },
//   data: { total_rows: 2, offset: 0, rows: [ [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 9 }
```

#### delete document
```javascript
.then(() => db.deleteDocument(dbName, 'doc2', '2-ee5ea9ac0bb1bec913a9b5e7bc11b113'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '3-ec0a86a95c5e98a5cd52c29b79b66372' },
//   status: 200,
//   message: 'OK - Document successfully removed',
//   duration: 39 }
```

#### copy document
```javascript
.then(() => db.copyDocument(dbName, 'doc', 'docCopy'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc3',
//      rev: '1-4c6114c65e295552ab1019e2b046b10e' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 42 }
```

#### bulk create documents
```javascript
.then(() => db.createBulkDocuments(dbName, [
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
//   status: 201,
//   message: 'Created – Document(s) have been created or updated',
//   duration: 74 }
```

#### find documents (requires CouchDB >= 2.0.0)
```javascript
.then(() => db.findDocuments(dbName, {
  selector: {
    $or: [{ name: 'Tick' }, {name: 'Track'}]
  },
  fields: ['_id', 'name']
}))
.then(console.log)
// { headers: { ... },
//   data:
//    { warning: 'no matching index found, create an index to optimize query time',
//      docs: [ [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 14 }
```

#### get uuids
```javascript
.then(() => db.getUuids(3))
.then(console.log)
// { headers: { ... },
//   data:
//    { uuids:
//       [ 'daae0752c6909d7ca4cd833f46014c47',
//         'daae0752c6909d7ca4cd833f460150c5',
//         'daae0752c6909d7ca4cd833f460156c5' ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 4 }
```

#### delete database
```javascript
.then(() => db.deleteDatabase(dbName))
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }
//   duration: 40 }
```
#### run generic HTTP GET request
```javascript
.then(() => db.getUrlPath('_all_dbs'))
.then(console.log)
// { headers: { ... },
//  data: [ '_replicator', '_users' ],
//  status: 200,
//  message: 'OK',
//  duration: 6 }
```

#### on error
```javascript
.then(() => db.getDocument(dbName, 'doc1'))
.catch(console.error)
// { headers: { ... },
//   data: { error: 'not_found', reason: 'Database does not exist.' },
//   status: 404,
//   message: 'Not Found - Document not found',
//   duration: 5 }
```

---

### View and Design Functions ([View.js](examples/view.js))

#### create design document
```javascript
const ddoc = {
  language: 'javascript',
  views: { view1: { map: 'function (doc) {emit(doc.name, doc.number)}' } }
}
const docId = 'ddoc1'

db.createDesignDocument(dbName, ddoc, docId)
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: '_design/ddoc1',
//      rev: '1-548c68d8cc2c1fac99964990a58f66fd' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 271 }
```

#### get design document
```javascript
db.getDesignDocument(dbName, docId)
.then(console.log)
// { headers: { ... },
//   data:
//    { _id: '_design/ddoc1',
//      _rev: '1-548c68d8cc2c1fac99964990a58f66fd',
//      language: 'javascript',
//      views: { view1: [Object] } },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 5 }
```

#### get design document info
```javascript
db.getDesignDocumentInfo(dbName, docId)
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
//        signature: '1e86d92af43c47ef58da4b645dbd47f1',
//        purge_seq: 0,
//        language: 'javascript',
//        disk_size: 408,
//        data_size: 0,
//        compact_running: false } },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 54 }
```

#### get view
```javascript
db.getView(dbName, docId, viewName, {limit: 3})
.then(console.log)
// { headers: { ... },
//   data:
//    { total_rows: 12,
//      offset: 0,
//      rows: [ [Object], [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 834 }
```

#### delete design document
```javascript
db.deleteDesignDocument(dbName, docId, rev)
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: '_design/ddoc1',
//      rev: '2-fd68157ec3c1915ebe0b248343292d34' },
//   status: 200,
//   message: 'OK - Document successfully removed',
//   duration: 49 }
```
---

### Index Functions ([index.js](examples/index.js))
#### CouchDB >= 2.0

### create index
```javascript
db.createIndex(dbName, {
  index: {
    fields: ['foo']
  },
  name: 'foo-index'
})
.then(console.log)
// { headers: { ... },
//   data:
//    { result: 'exists',
//      id: '_design/a5f4711fc9448864a13c81dc71e660b524d7410c',
//      name: 'foo-index' },
//   status: 200,
//   message: 'OK - Index created successfully or already exists',
//   duration: 14 }
```

### get index
```javascript
db.getIndex(dbName)
.then(console.log)
// { headers: { ... },
//   data: { total_rows: 2, indexes: [ [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Success',
//   duration: 6 }
```

### delete index
```javascript
db.getIndex(dbName)
.then(response => {
  const docId = response.data.indexes.find(e => e.name === 'foo-index').ddoc
  return db.deleteIndex(dbName, docId, 'foo-index')
})
.then(console.log)
// { headers: { ... },
//  data: { ok: true },
//  status: 200,
//  message: 'OK - Success',
//  duration: 45 }
```

---

# API Reference

See [examples](examples/) for details.

## configuration
#### db = couchdb-promises(options)
The options object may contain the following properties:
*   requestTimeout: Number=10000  - http request timeout in milliseconds
*   verifyCertificate: Boolean=true - verify server SSL certificate (https only)

## database functions
#### db.createDatabase( dbName )
create new database
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/common.html#put--db)
[[example]](examples/example.js)

#### db.getDatabase( dbName )
get information about the specified database
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/common.html#get--db)
[[example]](examples/example.js)

#### db.getDatabaseHead( dbName )
get minimal amount of information about the specified database
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/common.html#head--db)
[[example]](examples/example.js)

#### db.deleteDatabase( dbName )
delete the specified database
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/common.html#delete--db)
[[example]](examples/example.js)

#### db.listDatabases()
get list of all databases
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/server/common.html#get--_all_dbs)
[[example]](examples/example.js)

#### db.findDocuments( dbName, queryObj )
find documents using a declarative JSON querying syntax (CouchDB >= 2.0)
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/find.html#db-find)
[[example]](examples/example.js)

## document functions
#### db.getAllDocuments( dbName, \[queryObj] )
returns a JSON structure of all of the documents in a given database
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/bulk-api.html#db-all-docs)
[[example]](examples/example.js)

#### db.createDocument( dbName, doc )
create a new document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/common.html#post--db)
[[example]](examples/example.js)

#### db.createDocument( dbName, doc, \[docId] )
create a new document or a new revision of the existing document.
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/common.html#put--db-docid)
[[example]](examples/example.js)

#### db.deleteDocument( dbName, docId, rev )
marks the specified document as deleted
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/common.html#delete--db-docid)
[[example]](examples/example.js)

#### db.getDocument( dbName, docId, \[queryObj] )
get document by the specified docId
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/common.html#get--db-docid)
[[example]](examples/example.js)

#### db.getDocumentHead(dbName, docId, \[queryObj])
get a minimal amount of information about the specified document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/common.html#db-doc)
[[example]](examples/example.js)

#### db.copyDocument(dbName, docId, newDocId)
copy an existing document to a new document
<br>
[[CouchDB API]](https://wiki.apache.org/couchdb/HTTP_Document_API#COPY)

## index functions
#### db.createIndex( dbName, queryObj )
create database index
(CouchDB >= 2.0)
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/find.html#db-index)

#### db.getIndex( dbName )
get all database indexes
(CouchDB >= 2.0)
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/find.html#get--db-_index)

#### db.deleteIndex( dbName, docId, name )
delete database index
(CouchDB >= 2.0)
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/find.html#delete--db-_index-designdoc-json-name)


## document attachment functions
#### db.addAttachment( dbName, docId, attName, rev, contentType, data )
upload the supplied data as an attachment to the specified document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/attachments.html#put--db-docid-attname)
[[example]](examples/attachment.js)

#### db.getAttachment( dbName, docId, attachmentName, writeStream, \[rev] )
get the attachment associated with the document
<br>
[[CouchDB API]]( http://docs.couchdb.org/en/latest/api/document/attachments.html#get--db-docid-attname) [[example]](examples/attachment-stream.js)

#### db.getAttachmentHead( dbName, docName, docId, attachmentName, \[rev] )
get minimal amount of information about the specified attachment
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/attachments.html#db-doc-attachment)
[[example]](examples/attachment-stream.js)

#### db.deleteAttachment( dbName, docId, attachmentName, rev )
deletes the attachment attachment of the specified doc
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/document/attachments.html#delete--db-docid-attname)
[[example]](examples/attachment.js)

## view and design document functions
#### db.createDesignDocument( dbName, doc, docId )
create new design document or new revision of an existing design document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/ddoc/common.html#put--db-_design-ddoc)
[[example]](examples/view.js)

#### db.deleteDesignDocument( dbName, doc, docId, rev)
delete design document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/ddoc/common.html#delete--db-_design-ddoc)
[[example]](examples/view.js)

#### db.getDesignDocument( dbName, docId, queryObj )
get the contents of the design document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/ddoc/common.html#get--db-_design-ddoc)
[[example]](examples/view.js)

#### db.getDesignDocumentInfo( dbName, docId )
obtain information about the specified design document, including the index, index size and current status of the design document and associated index information
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/ddoc/common.html#db-design-design-doc-info)
[[example]](examples/view.js)

#### db.getView( dbName, docId, viewName, queryObj )
execute the specified view function from the specified design document
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/ddoc/views.html#db-design-design-doc-view-view-name)
[[example]](examples/view.js)

## bulk document functions
#### db.createBulkDocuments( dbName, docs, opts )
create or update multiple documents at the same time within a single request
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/database/bulk-api.html#db-bulk-docs)
[[example]](examples/example.js)

## miscellaneous functions
#### db.getInfo()
get meta information about the CouchDB server
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/server/common.html#get--)
[[example]](examples/example.js)

#### db.getUuids( count )
get one or more Universally Unique Identifiers (UUIDs) from the CouchDB server
<br>
[[CouchDB API]](http://docs.couchdb.org/en/latest/api/server/common.html#uuids)
[[example]](examples/example.js)

#### db.getUrlPath( path )
generic http GET request function
<br>[[example]](examples/example.js)
