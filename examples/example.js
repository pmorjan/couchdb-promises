const db = require('../index')
const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb'

db.getInfo(baseUrl)
.then(console.log)
// { headers: { ... },
//   data:
//    { couchdb: 'Welcome',
//      version: '2.0.0',
//      vendor: { name: 'The Apache Software Foundation' } },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 36 }

db.createDatabase(baseUrl, dbName)
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 201,
//   message: 'Created - Database created successfully',
//   duration: 131 }

.then(() => db.getDatabaseHead(baseUrl, dbName))
.then(console.log)
// { headers: { ... },
//   data: {},
//   status: 200,
//   message: 'OK - Database exists',
//   duration: 4 }

.then(() => db.listDatabases(baseUrl))
.then(console.log)
// { headers: { ... },
//   data: [ '_replicator', '_users', 'testdb' ],
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 4 }

.then(() => db.createDocument(baseUrl, dbName, {name: 'Bob'}))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'daae0752c6909d7ca4cd833f46014605',
//      rev: '1-5a26fa4b20e40bc9e2d3e47b168be460' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 42 }

.then(() => db.createDocument(baseUrl, dbName, {name: 'Alice'}, 'doc2'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '1-88b10f13383b5d1e34d1d66d296f061f' },
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 38 }

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
//   message: 'OK - Document exists',
//   duration: 6 }

.then(() => db.getDocument(baseUrl, dbName, 'doc2'))
.then(response => { console.log(response); return response.data })
// { headers: { ... },
//   data:
//    { _id: 'doc2',
//      _rev: '1-88b10f13383b5d1e34d1d66d296f061f',
//      name: 'Alice' },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 11 }

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
//   message: 'Created – Document created and stored on disk',
//   duration: 36 }

.then(() => db.getAllDocuments(baseUrl, dbName, {
  descending: true,
  include_docs: true
}))
.then(console.log)
// { headers: { ... },
//   data: { total_rows: 2, offset: 0, rows: [ [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 9 }

.then(() => db.createBulkDocuments(baseUrl, dbName, [
  {name: 'Tick'}, {name: 'Trick'}, {name: 'Track'}
], {all_or_nothing: false}))
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

.then(() => db.findDocuments(baseUrl, dbName, {
  selector: {
    $or: [{ name: 'Tick' }, {name: 'Track'}]
  },
  fields: ['_id', 'name']
}))
.catch(response => {
  if (response.status === 400) {
    return 'Warning: findDocument() requires CouchDB >= 2.0.0. Error ignored'
  } else {
    return Promise.reject(response)
  }
})
.then(console.log)
// { headers: { ... },
//   data:
//    { warning: 'no matching index found, create an index to optimize query time',
//      docs: [ [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 14 }

.then(() => db.deleteDocument(baseUrl, dbName, 'doc2', '2-ee5ea9ac0bb1bec913a9b5e7bc11b113'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: 'doc2',
//      rev: '3-ec0a86a95c5e98a5cd52c29b79b66372' },
//   status: 200,
//   message: 'OK - Document successfully removed',
//   duration: 39 }

.then(() => db.getUuids(baseUrl, 3))
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

.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully',
//   duration: 40 }

.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.catch(console.error)
// { headers: { ... },
//   data: { error: 'not_found', reason: 'no_db_file' },
//   status: 404,
//   message: 'Not Found - Document not found',
//   duration: 5 }
