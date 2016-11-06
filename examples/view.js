'use strict'
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb_' + Math.random().toString(36).slice(2, 8)
const months = ['January', 'February', 'March', 'April', 'Mai', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// create database and insert some documents
db.createDatabase(baseUrl, dbName)
.then(() => db.createBulkDocuments(baseUrl, dbName,
  months.map((x, i) => { return {name: x, number: i + 1} })
))
.then(console.log)

// create new design document
.then(() => db.createDesignDocument(baseUrl, dbName, {
  language: 'javascript',
  views: {
    view1: {
      map: 'function (doc) {emit(doc.name, doc.number)}'
    }
  }
}, 'ddoc1'))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//     id: '_design/ddoc1',
//     rev: '1-548c68d8cc2c1fac99964990a58f66fd' },
//  status: 201,
//  message: 'Created – Document created and stored on disk',
//  duration: 271 }

// get design document
.then(() => db.getDesignDocument(baseUrl, dbName, 'ddoc1'))
.then(console.log)
// { headers: { ... },
//   data:
//   { _id: '_design/ddoc1',
//     _rev: '1-548c68d8cc2c1fac99964990a58f66fd',
//     language: 'javascript',
//     views: { view1: [Object] } },
//  status: 200,
//  message: 'OK - Request completed successfully',
//  duration: 5 }

// get design document info
.then(() => db.getDesignDocumentInfo(baseUrl, dbName, 'ddoc1'))
.then(console.log)
// { headers: { ... },
//   data:
//    { name: 'ddoc1',
//      view_index:
//       { updates_pending: [Object],
//         waiting_commit: false,
//         waiting_clients: 0,
//         updater_running: false,
//         update_seq: 0,
//         sizes: [Object],
//         signature: '1e86d92af43c47ef58da4b645dbd47f1',
//         purge_seq: 0,
//         language: 'javascript',
//         disk_size: 408,
//         data_size: 0,
//         compact_running: false } },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 54 }

// request some data from view
// see https://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
.then(() => db.getView(baseUrl, dbName, 'ddoc1', 'view1', {
  decending: true,
  limit: 3
}))
.then(console.log)
// { headers: { ... },
//   data:
//    { total_rows: 12,
//      offset: 0,
//      rows: [ [Object], [Object], [Object] ] },
//   status: 200,
//   message: 'OK - Request completed successfully',
//   duration: 834 }

// delete design document
// get current revision - then delete
.then(() => db.getDesignDocument(baseUrl, dbName, 'ddoc1'))
.then(response => db.deleteDesignDocument(baseUrl, dbName, 'ddoc1', response.data._rev))
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//      id: '_design/ddoc1',
//      rev: '2-fd68157ec3c1915ebe0b248343292d34' },
//   status: 200,
//   message: 'OK - Document successfully removed',
//   duration: 49 }

// delete database
.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
