'use strict'
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb'

db.createDatabase(baseUrl, dbName)
.then(console.log)
// { data: { ok: true },
//   status: 201,
//   message: 'Created - Database created successfully' }

.then(() => db.listDatabases(baseUrl))
.then(console.log)
// { data: [ '_replicator', '_users', 'testdb' ],
//   status: 200,
//   message: 'OK - Request completed successfully' }

.then(() => db.createDocument(baseUrl, dbName, {name: 'Bob'}))
.then(console.log)
// { data:
//    { ok: true,
//      id: 'daae0752c6909d7ca4cd833f46014605',
//      rev: '1-5a26fa4b20e40bc9e2d3e47b168be460' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }

.then(() => db.createDocument(baseUrl, dbName, {name: 'Alice'}, 'doc2'))
.then(console.log)
// { data:
//    { ok: true,
//      id: 'doc2',
//      rev: '1-88b10f13383b5d1e34d1d66d296f061f' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }

.then(() => db.getDocument(baseUrl, dbName, 'doc2'))
.then((result) => { console.log(result); return result.data })
// { data:
//    { _id: 'doc2',
//      _rev: '1-88b10f13383b5d1e34d1d66d296f061f',
//      name: 'Alice' },
//   status: 200,
//   message: 'OK - Request completed successfully' }

.then((doc) => {
  doc.age = 42
  return db.createDocument(baseUrl, dbName, doc, 'doc2')
})
.then(console.log)
// { data:
//    { ok: true,
//      id: 'doc2',
//      rev: '2-ee5ea9ac0bb1bec913a9b5e7bc11b113' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }

.then(() => db.deleteDocument(baseUrl, dbName, 'doc2', '2-ee5ea9ac0bb1bec913a9b5e7bc11b113'))
.then(console.log)
// { data:
//    { ok: true,
//      id: 'doc2',
//      rev: '3-ec0a86a95c5e98a5cd52c29b79b66372' },
//   status: 200,
//   message: 'OK - Document successfully removed' }

.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }

.then(() => db.getUuids(baseUrl, 3))
.then(console.log)
// { data:
//    { uuids:
//       [ 'daae0752c6909d7ca4cd833f46014c47',
//         'daae0752c6909d7ca4cd833f460150c5',
//         'daae0752c6909d7ca4cd833f460156c5' ] },
//   status: 200,
//   message: 'OK - Request completed successfully' }

.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.catch(console.error)
// { data: { error: 'not_found', reason: 'no_db_file' },
//   status: 404,
//   message: 'Not Found - Document not found' }
