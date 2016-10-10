const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')

const db = require('../index')
const baseUrl = 'http://localhost:5984'
const dbName = 'testdb_' + Date.now()

const testFile = '/bin/sh'
const tempFile = path.join(os.tmpDir(), 'testfile_' + Date.now())
const writeStream = fs.createWriteStream(tempFile)

function md5 (file) {
  return new Promise(function (resolve, reject) {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(file)

    stream.on('data', function (data) {
      hash.update(data, 'utf8')
    })
    stream.on('end', function () {
      resolve(hash.digest('base64'))
    })
    stream.on('error', function (error) {
      reject(error)
    })
  })
}

function log (obj) {
  console.log(JSON.stringify(obj, null, 2))
  return obj
}

const doc1 = {
  name: 'test document'
}

const attachment = {
  name: testFile,
  data: fs.createReadStream(testFile),
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
// console.log(`attachment "${testFile}" written to: ${tempFile}`)
// {
//   "headers": { ... },
//   "status": 200,
//   "message": "OK - Attachment exists"
// }
.then(() => Promise.all([md5(testFile), md5(tempFile)]))
.then(values => {
  console.log(`md5 testFile: ${values[0]}`)
  console.log(`md5 tempFile: ${values[1]}`)
})
// md5 testFile: LMPCZkERLBvQFz85a312Yg==
// md5 tempFile: LMPCZkERLBvQFz85a312Yg==

.then(() => db.deleteDatabase(baseUrl, dbName))
.catch(console.error)
