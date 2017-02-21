# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 3.0.0 - 2017-02-21
- baseUrl is now a required property of the options object. This is an API breaking change.

```
old:
const db = require('couchdb-promises')({})
const baseUrl = 'http://localhost:5984'
db.getDocument(baseUrl, dbName, 'mydoc')

new:
const db = require('couchdb-promises')({
    baseUrl: 'http://localhost:5984'
})
db.getDocument(dbName, 'mydoc')
```

- new functions for server-side update handlers. See [Document_Update_Handlers](https://wiki.apache.org/couchdb/Document_Update_Handlers) for details
 + executeUpdateFunction()
 + executeUpdateFunctionForDocument()

## 2.0.0 - 2017-01-29
- require now returns a factory function with an optional property object.
This is an API breaking change.

```
old:
const db = require('couchdb-promises')

new:
const db = require('couchdb-promises')({
  requestTimeout: 5000,
  verifyCertificate: true
})
```

- new function copyDocument() to copy an existing document to a new document
(by <dsquier@slitscan.com>)

## 1.5.0 - 2016-11-28
- new generic function db.getUrl(url)
- check for mandatory port portion of baseUrl
- update documentation
- example.js: correct error handling

## 1.4.0 - 2016-11-16
- New index functions (CouchDB >= 2.0)
- createIndex()
- getIndex()
- deleteIndex()

## 1.3.0 - 2016-11-06
- New function findDocuments() (CouchDB >= 2.0)
- New property "duration" to report the execution time in milliseconds

## 1.2.1 - 2016-10-16
- getAttachment() no longer fails if given writable stream is an http.ServerResponse object

## 1.2.0 - 2016-10-11
New functions for working with attachments either as Buffer, String
or Stream.
- Add new function getAttachment()
- Add new function getAttachmentHead()
- Add new function addAttachment()
- Add new function deleteAttachment()

## 1.1.0 - 2016-10-01
- The response object now includes a 4th property 'headers'
- Add new function getDatabase()
- Add new function getDatabaseHead()
- Add new function getDocumentHead()

## 1.0.0 - 2016-09-24
1.0 release
