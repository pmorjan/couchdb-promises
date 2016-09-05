
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/pmorjan/couchdb-promises.svg?branch=master)](https://travis-ci.org/pmorjan/couchdb-promises)

# couchdb-promises

### Yet another Node module for CouchDB that uses ES6 promises but without dependencies.

### Installation
```
npm install couchdb-promises
```

### Example
```javascript
'use strict'
const db = require('couchdb-promises')

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

.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully' }
//

.catch(console.error)
```
