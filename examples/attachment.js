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
// attachment
//
const a1 = {
  name: 'hello.txt',
  data: `hello world`,   // 11 chars
  contentType: 'text/plain'
}

db.createDatabase(baseUrl, dbName)
.then(() => db.createDocument(baseUrl, dbName, doc1, 'myDocument'))
.then(response => {
  const rev = response.data.rev
  return db.addAttachment(baseUrl, dbName, 'myDocument', a1.name, rev, a1.contentType, a1.data)
})
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "ok": true,
//     "id": "myDocument",
//     "rev": "2-8e7a984fc45b0d19013ce8eb9009a472"
//   },
//   "status": 201,
//   "message": "OK - Created"
// }

.then(() => db.getDocument(baseUrl, dbName, 'myDocument', {attachments: true}))
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "_id": "myDocument",
//     "_rev": "2-8e7a984fc45b0d19013ce8eb9009a472",
//     "name": "test document",
//     "_attachments": {
//       "hello.txt": {
//         "content_type": "text/plain",
//         "revpos": 2,
//         "digest": "md5-hRGJCyHA9ydm4LSbkWIiFQ==",
//         "data": "aGVsbG8Kd29ybGQ="
//       }
//     }
//   },
//   "status": 200,
//   "message": "OK - Request completed successfully"
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
//     "rev": "3-863c58969d601c2cd94663fe4ab915d1"
//   },
//   "status": 200,
//   "message": "OK – Attachment successfully removed"
// }

.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
