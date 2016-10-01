const db = require('../index')
const baseUrl = 'http://localhost:5984'
const dbName = 'simpledb'

db.createDatabase(baseUrl, dbName)
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 201,
//   message: 'Created - Database created successfully' }

.then(() => db.createDocument(baseUrl, dbName, {
  firstName: 'Alice',
  lastName: 'Cooper',
  age: 42
}, 'doc1'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//     id: 'doc1',
//     rev: '1-8b44d4a8addaced8d023b53e208421f1' },
//   status: 201,
//   message: 'Created – Document created and stored on disk' }

.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.then(console.log)
// { headers: { ... },
//   data:
//    { _id: 'doc1',
//      _rev: '1-8b44d4a8addaced8d023b53e208421f1',
//      firstName: 'Alice',
//      lastName: 'Cooper',
//      age: 42 },
//   status: 200,
//   message: 'OK - Request completed successfully' }

.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }

.catch(console.error)
