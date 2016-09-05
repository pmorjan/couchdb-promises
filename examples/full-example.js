'use strict'
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb'

db.createDatabase(baseUrl, dbName)
.then(console.log)
// { data: { ok: true },
//  status: 201,
//  message: 'Created - Database created successfully' }

.then(() => db.listDatabases(baseUrl))
.then(console.log)
// { data: [ '_replicator', '_users', 'testdb' ],
//   status: 200,
//   message: 'OK - Request completed successfully' }

.then(() => db.createDocument(baseUrl, dbName, 'doc1', {foo: 'bar'}))
.then(console.log)
// { data:
//    { ok: true,
//     id: 'doc1',
//      rev: '1-4c6114c65e295552ab1019e2b046b10e' },
//  status: 201,
//  message: 'Created – Document created and stored on disk' }

.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.then((result) => { console.log(result); return result.data })
// { data:
//   { _id: 'doc1',
//     _rev: '1-4c6114c65e295552ab1019e2b046b10e',
//     foo: 'bar' },
//  status: 200,
//  message: 'OK - Request completed successfully' }

.then((doc) => {
  doc.baz = 42
  return db.createDocument(baseUrl, dbName, 'doc1', doc)
})
.then(console.log)
// { data:
//    { ok: true,
//      id: 'doc1',
//      rev: '2-4e33118ad1c90b2745f3288f63a2936d' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }

.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.then(console.log)
// { data:
//    { _id: 'doc1',
//      _rev: '2-4e33118ad1c90b2745f3288f63a2936d',
//      foo: 'bar',
//      baz: 42 },
//   status: 200,
//   message: 'OK - Request completed successfully' }

.then(() => db.deleteDocument(baseUrl, dbName, 'doc1', '2-4e33118ad1c90b2745f3288f63a2936d'))
.then(console.log)
// { data:
//   { ok: true,
//     id: 'doc1',
//     rev: '3-f77441443d2a520735cbfce7c450428d' },
//  status: 200,
//  message: 'OK - Document successfully removed' }

.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }

.then(() => db.getUuids(baseUrl, 3))
.then(console.log)
// { data:
//    { uuids:
//       [ '18b5971b5a7b606613fefb10ba100d10',
//         '18b5971b5a7b606613fefb10ba10118c',
//         '18b5971b5a7b606613fefb10ba101524' ] }
//   status: 200,
//   message: 'OK - Request completed successfully' }

.catch(console.error)
