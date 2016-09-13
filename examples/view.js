'use strict'
const db = require('../index')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb_' + Math.random().toString(36).slice(2, 8)

function insertDocuments () {
  let p = Promise.resolve()
  const MONTHS = ['January', 'February', 'March', 'April', 'Mai', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  MONTHS.forEach((month, idx) => {
    p = p.then(() => db.createDocument(baseUrl, dbName, {
      name: month,
      number: idx + 1
    }))
  })
  return p
}

// create database and insert some documents
db.createDatabase(baseUrl, dbName)
.then(insertDocuments)

// create new design document
.then(() => db.createDesignDocument(baseUrl, dbName, {
  language: 'javascript',
  views: {
    all: {
      map: 'function (doc) {emit(doc.name, doc.number)}'
    }
  }
}, 'ddoc1'))
.then(console.log)

// get design document
.then(() => db.getDesignDocument(baseUrl, dbName, 'ddoc1'))
.then(console.log)

// request some data from view
.then(() => db.getView(baseUrl, dbName, 'ddoc1', 'all', {
  decending: true,
  limit: 3
}))
.then(console.log)
// { total_rows: 12,
//   offset: 0,
//   rows:
//    [ { id: 'd2017cdf467dc7260f83cf115a06f1c2',
//        key: 'April',
//        value: 4 },
//      { id: 'd2017cdf467dc7260f83cf115a07183f',
//        key: 'August',
//        value: 8 },
//      { id: 'd2017cdf467dc7260f83cf115a072d01',
//        key: 'December',
//        value: 12 } ] }

// delete database
.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
