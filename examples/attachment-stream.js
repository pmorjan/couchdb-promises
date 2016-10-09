const fs = require('fs')

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
// large attachment via filesystem readable stream
//
const a1 = {
  name: 'text.txt',
  data: fs.createReadStream('/etc/services'),
  contentType: 'text/plain'
}

db.createDatabase(baseUrl, dbName)
.then(() => db.createDocument(baseUrl, dbName, doc1, 'myDocument'))

.then(response => {
  const rev = response.data.rev
  return db.addAttachment(baseUrl, dbName, 'myDocument', a1.name, rev, a1.contentType, a1.data)
})
.then(log)

.then(() => db.getDocument(baseUrl, dbName, 'myDocument', {attachments: false}))
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "_id": "myDocument",
//     "_rev": "2-61ae0048c688ab688816dd04da7242ce",
//     "name": "test document",
//     "_attachments": {
//       "text.txt": {
//         "content_type": "text/plain",
//         "revpos": 2,
//         "digest": "md5-A+u+TUuJ1Bwz88vxDPn6pw==",
//         "length": 677972,
//         "stub": true
//       }
//     }
//   },
//   "status": 200,
//   "message": "OK - Request completed successfully"
// }

.then(() => db.getAttachmentHead(baseUrl, dbName, 'myDocument', a1.name))
.then(log)
// {
//   "headers": {
//     "accept-ranges": "none",
//     "cache-control": "must-revalidate",
//     "connection": "close",
//     "content-length": "677972",
//     "content-type": "text/plain",
//     "date": "Sun, 09 Oct 2016 12:52:50 GMT",
//     "etag": "\"A+u+TUuJ1Bwz88vxDPn6pw==\"",
//     "server": "CouchDB/2.0.0 (Erlang OTP/19)"
//   },
//   "data": {},
//   "status": 200,
//   "message": "OK - Attachment exists"
// }

.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
