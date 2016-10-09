const fs = require('fs')
const os = require('os')
const path = require('path')

const db = require('../index')
const baseUrl = 'http://localhost:5984'
const dbName = 'testdb_' + Date.now()

const tempfile = path.join(os.tmpDir(), 'testfile_' + Date.now())

const writeStream = fs.createWriteStream(tempfile)
writeStream.on('close', function () {
  console.log('attachment written to: ' + tempfile)
})
writeStream.on('error', function (err) {
  console.error(err)
  writeStream.close()
})

function log (obj) {
  console.log(JSON.stringify(obj, null, 2))
  return obj
}

const doc1 = {
  name: 'test document'
}

const attachment = {
  name: os.userInfo().shell,
  data: fs.createReadStream(os.userInfo().shell),
  contentType: 'application/octet-stream'
}

db.createDatabase(baseUrl, dbName)
.then(() => db.createDocument(baseUrl, dbName, doc1, 'myDocument'))

.then(response => {
  const rev = response.data.rev
  return db.addAttachment(baseUrl, dbName, 'myDocument', attachment.name, rev, attachment.contentType, attachment.data)
})

.then(() => db.getDocument(baseUrl, dbName, 'myDocument'))
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "_id": "myDocument",
//     "_rev": "2-93204aa69c0dc921ba2640e349d14a74",
//     "name": "test document",
//     "_attachments": {
//       "shell": {
//         "content_type": "application/octet-stream",
//         "revpos": 2,
//         "digest": "md5-XXWD2A5TFKyETu3G1oxs1w==",
//         "length": 628496,
//         "stub": true
//       }
//     }
//   },
//   "status": 200,
//   "message": "OK - Request completed successfully"
// }

.then(() => db.getAttachment(baseUrl, dbName, 'myDocument', attachment.name, writeStream))
.then(log)
// {
//   "headers": { ... },
//   "status": 200,
//   "message": "OK - Attachment exists"
// }

.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
