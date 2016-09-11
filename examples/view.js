'use strict'
const db = require('couchdb-promises')

const baseUrl = process.env.DB_URL || 'http://localhost:5984'
const dbName = 'testdb'
const docId = 'doc1'
const viewName = 'date'
const doc = {
  language: 'javascript',
  views: {
    date: {
      map: 'function(doc) {if (doc.date) {emit(doc.date, 1)}}'
    }
  }
}
const queryObj = {
  limit: 3,
  include_docs: true
}

db.getDesignDocument(baseUrl, dbName, docId)
.then(response => db.deleteDesignDocument(baseUrl, dbName, docId, response.data._rev))
.catch(console.error)
.then(response => db.createDesignDocument(baseUrl, dbName, doc, docId))
.then(() => db.getView(baseUrl, dbName, docId, viewName, queryObj))
.then(response => console.log(response.data.rows))
.catch(console.error)
