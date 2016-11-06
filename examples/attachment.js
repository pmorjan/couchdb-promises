const fs = require('fs')
const path = require('path')

const db = require('../index')
const baseUrl = 'http://localhost:5984'
const dbName = 'testdb_' + Date.now()

function log (obj) {
  console.log(JSON.stringify(obj, null, 2))
  return obj
}

//
// document
//
const doc1 = {
  name: 'test document'
}

//
// small text attachment as String
//
const a1 = {
  name: 'hello.txt',
  data: `hello\nworld`,
  contentType: 'text/plain'
}

//
// binary attachment as Buffer
//
const a2 = {
  name: 'test.png',
  data: fs.readFileSync(path.join(__dirname, '../test/test.png')),
  contentType: 'image/png'
}

db.createDatabase(baseUrl, dbName)
.then(() => db.createDocument(baseUrl, dbName, doc1, 'myDocument'))

// attach text file
.then(response => {
  const rev = response.data.rev
  return db.addAttachment(baseUrl, dbName, 'myDocument', a1.name, rev, a1.contentType, a1.data)
})
.then(log)
// {
//  "headers": { ... },
//  "data": {
//    "ok": true,
//    "id": "myDocument",
//    "rev": "2-58ba51a03eb2da5f68b864e496eb0b9b"
//  },
//  "status": 201,
//  "message": "OK - Created",
//  "duration": 49
// }

.then(response => {
  const rev = response.data.rev
  return db.addAttachment(baseUrl, dbName, 'myDocument', a2.name, rev, a2.contentType, a2.data)
})
.then(log)
// {
//  "headers": { ... },
//  "data": {
//     "ok": true,
//     "id": "myDocument",
//     "rev": "3-86da2d34bc4d1c0e80e283128d7644f8"
//   },
//  "status": 201,
//  "message": "OK - Created",
//  "duration": 41
// }

.then(() => db.getDocument(baseUrl, dbName, 'myDocument', {attachments: true}))
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "_id": "myDocument",
//     "_rev": "3-86da2d34bc4d1c0e80e283128d7644f8",
//     "name": "test document",
//     "_attachments": {
//       "test.png": {
//         "content_type": "image/png",
//         "revpos": 3,
//         "digest": "md5-6kpRjNkALl9BEDJoTyxGTg==",
//         "data": "iVBORw0KGgoAAAANSUhEUgAAAK ... SuQmCC"
//       },
//       "hello.txt": {
//         "content_type": "text/plain",
//         "revpos": 2,
//         "digest": "md5-7mkg+nM0HN26sZkLN8KVSA==",
//         "data": "aGVsbG8gd29ybGQ="
//       }
//     }
//   },
//   "status": 200,
//   "message": "OK - Request completed successfully",
//   "duration": 9
// }

.then(response => {
  const base64 = response.data._attachments['hello.txt'].data
  const doc = Buffer.from(base64, 'base64').toString('utf8')
  console.log(doc)
  return response
})
// hello
// world

.then(response => {
  const rev = response.data._rev
  return db.deleteAttachment(baseUrl, dbName, 'myDocument', a1.name, rev)
})
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "ok": true,
//     "id": "myDocument",
//     "rev": "4-31db13e519dd8822f86b0ddee1456041"
//   },
//   "status": 200,
//   "message": "OK – Attachment successfully removed",
//   "duration": 40
// }

.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
