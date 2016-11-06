const db = require('../index')
const baseUrl = 'http://localhost:5984'
const dbName = 'simpledb'

//
// create database if it doesn't already exists
//
db.listDatabases(baseUrl)
.then(response => {
  if (response.data.indexOf(dbName) >= 0) {
    return Promise.resolve('ok')
  } else {
    return db.createDatabase(baseUrl, dbName)
  }
})
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 201,
//   message: 'Created - Database created successfully',
//   duration: 131 }

//
// update existing document or create new
//
.then(() => db.getDocument(baseUrl, dbName, 'mydoc'))
.then(response => {
  // update existing document
  const doc = response.data
  doc.date = new Date()
  doc.counter++
  return db.createDocument(baseUrl, dbName, doc, 'mydoc')
})
.catch(response => {
  if (response.status === 404) {
    // create new document
    const newDoc = { date: new Date(), counter: 1 }
    return db.createDocument(baseUrl, dbName, newDoc, 'mydoc')
  } else {
    return Promise.reject(response)
  }
})
.then(console.log)
// { headers: { ... },
//   data:
//    { ok: true,
//     id: 'mydoc',
//     rev: '1-bd2f1679ee2b78d8b90ebdf383af59b2',
//   status: 201,
//   message: 'Created – Document created and stored on disk',
//   duration: 41 }

.then(() => db.getDocument(baseUrl, dbName, 'mydoc'))
.then(response => console.log(response.data.counter, response.data.date))
// 1 '2016-11-01T08:20:39.354Z'

.then(() => db.deleteDatabase(baseUrl, dbName))
.then(console.log)
// { headers: { ... },
//   data: { ok: true },
//   status: 200,
//   message: 'OK - Database removed successfully',
//   duration: 42 }

.catch(console.error)
