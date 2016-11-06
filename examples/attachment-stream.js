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
  title: 'test document with large attachment'
}

//
// large binary attachment as Stream
//
const attachment = {
  name: testFile,
  stream: fs.createReadStream(testFile),
  contentType: 'application/octet-stream'
}

db.createDatabase(baseUrl, dbName)
.then(() => db.createDocument(baseUrl, dbName, doc1, 'myDoc'))

.then(response => {
  const rev = response.data.rev
  return db.addAttachment(baseUrl, dbName, 'myDoc', attachment.name, rev, attachment.contentType, attachment.stream)
})

.then(() => db.getDocument(baseUrl, dbName, 'myDoc'))
.then(log)
// {
//   "headers": { ... },
//   "data": {
//     "_id": "myDoc",
//     "_rev": "2-f7b9138c2817cc8e6082430c5d18c842",
//     "title": "test document with large attachment",
//     "_attachments": {
//       "/bin/sh": {
//         "content_type": "application/octet-stream",
//         "revpos": 2,
//         "digest": "md5-LMPCZkERLBvQFz85a312Yg==",
//         "length": 632672,
//         "stub": true
//       }
//     }
//   },
//   "status": 200,
//   "message": "OK - Request completed successfully"
//   "durataion": 6

.then(() => db.getAttachment(baseUrl, dbName, 'myDoc', attachment.name, writeStream))
.then(log)
// {
//   "headers": { ... },
//   "status": 200,
//   "message": "OK - Attachment exists"
//   "durataion": 6
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
