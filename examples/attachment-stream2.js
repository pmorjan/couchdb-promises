const spawn = require('child_process').spawn
const os = require('os')

const db = require('../index')
const baseUrl = 'http://localhost:5984'
const dbName = 'testdb'

/**
 * create db if it does not already exist
 * @return {Promise}
 */
function initDB () {
  return db.listDatabases(baseUrl)
    .then(response => {
      if (response.data.indexOf(dbName) !== -1) {
        // database already exists
        return Promise.resolve('ok')
      } else {
        // create new database
        return db.createDatabase(baseUrl, dbName).then(() => 'ok')
      }
    })
}

/**
 * get existing document or create new
 * @param  {String} docName
 * @return {Promise} - fulfilled with document revision
 */
function initDocument (docName) {
  return db.getDocument(baseUrl, dbName, docName)
    .then(response => response.data._rev) // document already exists
    .catch(response => {
      if (response.status === 404) {
        // create new document
        return db.createDocument(baseUrl, dbName, {foo: 'bar'}, docName)
          .then(response => response.data.rev)
      } else {
        // real error
        return Promise.reject(response)
      }
    })
}

/**
 * attach the output of 'top' to the document
 * @param {String} docName
 * @param {String} docRev
 * @return {Promise} - fulfilled with new document revision
 */
function addAttachment (docName, docRev) {
  const args = os.type() === 'Darwin' ? ['-l', '1'] : ['-b', '-n', '1']
  const stream = spawn('top', args).stdout
  const attName = `top-${Date.now()}.txt`
  const attContentType = 'text/plain'
  return db.addAttachment(baseUrl, dbName, docName, attName, docRev, attContentType, stream)
    .then(response => response.data.rev)
}

initDB()
.then(() => initDocument('top'))
.then(rev => addAttachment('top', rev))
.then(() => db.getDocument(baseUrl, dbName, 'top'))
.then(response => console.log(response.data))
.catch(console.error)

// { _id: 'top',
//   _rev: '2-e83261ca536e24f5292a737801332e30',
//   foo: 'bar',
//   _attachments:
//    { 'top-1476541540323.txt':
//       { content_type: 'text/plain',
//         revpos: 2,
//         digest: 'md5-tkIz+RyAXcgZ8vWCLQqhwg==',
//         length: 72330,
//         stub: true } } }
