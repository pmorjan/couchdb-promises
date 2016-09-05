
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/pmorjan/couchdb-promises.svg?branch=master)](https://travis-ci.org/pmorjan/couchdb-promises)
[![NPM Version](https://img.shields.io/npm/v/couchdb-promises.svg)](https://www.npmjs.com/package/couchdb-promises)

# couchdb-promises

### Yet another Node module for CouchDB that uses ES6 promises.

* **no dependencies**
* **as simple as possible**

### Installation
```
npm install couchdb-promises
```

### Example
file: [full-example.js](examples/full-example.js)
#### create database
```javascript
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb'

db.createDatabase(baseUrl, dbName)
.then(console.log)
// { data: { ok: true },
//  status: 201,
//  message: 'Created - Database created successfully' }
```

#### list databases
```javascript
.then(() => db.listDatabases(baseUrl))
.then(console.log)
// { data: [ '_replicator', '_users', 'testdb' ],
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### create document
```javascript
.then(() => db.createDocument(baseUrl, dbName, 'doc1', {foo: 'bar'}))
.then(console.log)
// { data:
//    { ok: true,
//     id: 'doc1',
//      rev: '1-4c6114c65e295552ab1019e2b046b10e' },
//  status: 201,
//  message: 'Created – Document created and stored on disk' }
```

#### get document
```javascript
.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.then((result) => { console.log(result); return result.data })
// { data:
//   { _id: 'doc1',
//     _rev: '1-4c6114c65e295552ab1019e2b046b10e',
//     foo: 'bar' },
//  status: 200,
//  message: 'OK - Request completed successfully' }
```

#### update document
```javascript
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
```

#### get document (again)
```javascript
.then(() => db.getDocument(baseUrl, dbName, 'doc1'))
.then(console.log)
// { data:
//    { _id: 'doc1',
//      _rev: '2-4e33118ad1c90b2745f3288f63a2936d',
//      foo: 'bar',
//      baz: 42 },
//   status: 200,
//   message: 'OK - Request completed successfully' }
```

#### delete document
```javascript
.then(() => db.deleteDocument(baseUrl, dbName, 'doc1', '2-4e33118ad1c90b2745f3288f63a2936d'))
.then(console.log)
// { data:
//   { ok: true,
//     id: 'doc1',
//     rev: '3-f77441443d2a520735cbfce7c450428d' },
//  status: 200,
//  message: 'OK - Document successfully removed' }
```

#### delete database
```javascript
.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }
```

```javascript
.catch(console.error)

```



