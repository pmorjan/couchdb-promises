# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.3.0 - 2016-11-06
- New method findDocuments()
- New property "duration" to report the execution time in milliseconds

## 1.2.1 - 2016-10-16
- getAttachment() no longer fails if given writable stream is an http.ServerResponse object

## 1.2.0 - 2016-10-11
New methods for working with attachments either as Buffer, String 
or Stream.
- Add new method getAttachment()
- Add new method getAttachmentHead()
- Add new method addAttachment()
- Add new method deleteAttachment()

## 1.1.0 - 2016-10-01
- The response object now includes a 4th property 'headers'
- Add new method getDatabase()
- Add new method getDatabaseHead()
- Add new method getDocumentHead()

## 1.0.0 - 2016-09-24
1.0 release
