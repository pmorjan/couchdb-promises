//
// CouchDB version >= 2.0 only !
//
'use strict'
const db = require('../index')({
  requestTimeout: 3000
})

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'indexdb_' + Date.now()

//
// create database and insert some documents
//
db.createDatabase(baseUrl, dbName)
.then(() => db.createBulkDocuments(baseUrl, dbName,
  Array(1000).fill().map(() => { return {name: Math.random().toString(36).slice(2, 8)} })
))

//
// create index
//
.then(() => db.createIndex(baseUrl, dbName, {
  index: {
    fields: ['name']
  },
  name: 'name-index'
}))
.then(console.log)
// { headers: { ... }
//   data:
//    { result: 'created',
//      id: '_design/37ca0de9e0e68521c0eca0239d9b29c5027ae7ea',
//      name: 'name-index' },
//   status: 200,
//   message: 'OK - Index created successfully or already exists',
//   duration: 37 }

//
// get index
//
.then(() => db.getIndex(baseUrl, dbName))
.then(response => { console.log(response); return response })
// { headers: { ... },
//  data: { total_rows: 2, indexes: [ [Object], [Object] ] },
//  status: 200,
//  message: 'OK - Success',
//  duration: 7 }

//
// print index array
//
.then(response => { console.log(response.data.indexes); return response })
// [ { ddoc: null,
//     name: '_all_docs',
//     type: 'special',
//     def: { fields: [Object] } },
//   { ddoc: '_design/37ca0de9e0e68521c0eca0239d9b29c5027ae7ea',
//     name: 'name-index',
//     type: 'json',
//     def: { fields: [Object] } } ]

//
// delete index
//
.then(response => {
  const docId = response.data.indexes.find(e => e.name === 'name-index').ddoc
  return db.deleteIndex(baseUrl, dbName, docId, 'name-index')
})
.then(console.log)
// { headers: { ... }
//   data: { ok: true },
//   status: 200,
//   message: 'OK - Success',
//   duration: 42 }

// delete database
.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)

