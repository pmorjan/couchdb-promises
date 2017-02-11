'use strict'
const db = require('../index')({
  baseUrl: process.env.DB_URL || 'http://localhost:5984'
})

const dbName = 'update_' + Math.random().toString(36).slice(2, 8)

//
// create database
//
db.createDatabase(dbName)
.then(() => db.createDocument(dbName, {
  name: 'foo',
  count: 0
}, 'mydoc'))

//
// create design document
//
.then(() => db.createDesignDocument(dbName, {
  language: 'javascript',
  updates: {
    add: `function(doc, req) {
            var body = JSON.parse(req.body)
            doc.count += body.amount
            return [doc, 'added ' + body.amount]
          }`
  }
}, 'ddoc1'))

//
// call update function
//
.then(() => db.executeUpdateFunctionForDocument(dbName, 'ddoc1', 'add', {'amount': 10}, 'mydoc'))
.then(() => db.executeUpdateFunctionForDocument(dbName, 'ddoc1', 'add', {'amount': 10}, 'mydoc'))
.then(() => db.executeUpdateFunctionForDocument(dbName, 'ddoc1', 'add', {'amount': 10}, 'mydoc'))

//
// get document
//
.then(() => db.getDocument(dbName, 'mydoc'))
.then(response => { console.log(response.data) })
// { _id: 'mydoc',
// _rev: '4-c740423ee989e17a7e019875e3bc4bfc',
//  name: 'foo',
//  count: 30 }

.then(() => db.deleteDatabase(dbName))
.catch(console.error)

