// http://docs.couchdb.org/en/1.6.1/api/index.html
'use strict'
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const urlParse = require('url').parse
//
const validator = require('validator')
const debug = require('debug')('db')
//
const QUERY_KEYS_JSON = ['key', 'keys', 'startkey', 'endkey']

function request (param) {
  const url = param.url
  const method = param.method || 'GET'
  const statusOk = param.statusOk || {}
  const statusNotOk = param.statusNotOk || {}
  const doc = param.doc || {}

  debug('%s %s', method, url)

  const validatorOptions = {protocols: ['http', 'https'], require_tld: false, require_protocol: true}
  if (!validator.isURL(url, validatorOptions)) {
    return Promise.reject({
      data: 'invalid url',
      status: 400,
      message: 'bad request'
    })
  }

  const o = urlParse(url)
  const httpOptions = {
    hostname: o.host && o.host.split(':')[0],
    port: o.port || 443,
    path: o.path,
    auth: o.auth,
    protocol: o.protocol,
    method: method,
    headers: {'user-agent': 'couchdb-promise'}
  }

  return new Promise(function (resolve, reject) {
    const lib = httpOptions.protocol === 'https:' ? https : http
    const req = lib.request(httpOptions, function (res) {
      debug(`    ${res.statusCode} ${method + ' '.repeat(6 - method.length)} ${url}`)
      let body = ''
      res.setEncoding('utf8')
      res.on('data', function (data) {
        body += data
      })
      res.on('end', function () {
        let ret
        try {
          var data = JSON.parse(body)
          ret = {
            data: data,
            status: res.statusCode,
            message: (statusOk[res.statusCode] || statusNotOk[res.statusCode] || 'unknown status')
          }
        } catch (err) {
          ret = {
            data: err.message,
            status: 500,
            message: 'server error'
          }
        }

        if (!statusOk[ret.status]) {
          reject(ret)
        } else {
          resolve(ret)
        }
      })
    })

    req.on('error', function (err) {
      reject({
        data: err,
        status: 500,
        message: 'general server error'
      })
    })

    if (doc) {
      req.write(JSON.stringify(doc))
    }
    req.end()
  })
}

/**
 * All promisses are settled  with an object with the folloing properties
 *  data:  response from the database server
 *  status: {Number} status http status code
 *  message: {String} message http message
 */

/**
 * Get the list of all databases. Returns a promise which is
 *  data: {Array} list of databases
 * @return {Promise}
 */
function listDatabases (baseUrl) {
  return request({
    url: baseUrl + '/_all_dbs',
    method: 'GET',
    statusOk: {
      200: 'OK - Request completed successfully'
    }
  })
}

/**
 * Create database
 * @param  {String} baseUrl base server url
 * @param  {String} dbName
 * @return {Promise}
 */
function createDatabase (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${dbName}`,
    method: 'PUT',
    statusOk: {
      201: 'Created - Database created successfully'
    },
    statusNotOk: {
      400: 'Bad Request - Invalid database name',
      401: 'Unauthorized - CouchDB Server Administrator privileges required',
      412: 'Precondition Failed - Database already exists'
    }
  })
}

/**
 * Delete database
 * @param  {String} baseUrl base server url
 * @param  {String} dbName
 * @return {Promise}
 */
function deleteDatabase (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${dbName}`,
    method: 'DELETE',
    statusOk: {
      200: 'OK - Database removed successfully'
    },
    statusNotOk: {
      400: 'Bad Request - Invalid database name or forgotten document id by accident',
      401: 'Unauthorized - CouchDB Server Administrator privileges required',
      404: 'Not Found - Database doesn’t exist'
    }
  })
}

/**
 * Get Document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {Object} query
 * @return {Promise}
 */
function getDocument (baseUrl, dbName, docId, query) {
  const obj = Object.assign({}, query)
  for (let key in obj) {
    if (QUERY_KEYS_JSON.indexOf(key) !== -1) {
      obj[key] = JSON.stringify(obj[key])
    }
  }
  const queryStr = Object.keys(obj).length ? '?' + querystring.stringify(obj) : ''

  return request({
    url: `${baseUrl}/${dbName}/${docId}${queryStr}`,
    method: 'GET',
    statusOk: {
      200: 'OK - Request completed successfully',
      304: 'Not Modified - Document wasn’t modified since specified revision'
    },
    statusNotOk: {
      400: 'Bad Request - The format of the request or revision was invalid',
      401: 'Unauthorized - Read privilege required',
      404: 'Not Found - Document not found'
    }
  })
}

/**
 * Create a new named document or new revision of an existing document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {Object} doc
 * @return {Promise}
 */
function createDocument (baseUrl, dbName, docId, doc) {
  return request({
    url: `${baseUrl}/${dbName}/${encodeURIComponent(docId)}`,
    method: 'PUT',
    doc: doc,
    statusOk: {
      201: 'Created – Document created and stored on disk',
      202: 'Accepted – Document data accepted, but not yet stored on disk'
    },
    statusNotOk: {
      400: 'Bad Request – Invalid request body or parameters',
      401: 'Unauthorized – Write privileges required',
      404: 'Not Found – Specified database or document ID doesn’t exists',
      409: 'Conflict – Document with the specified ID already exists or specified revision is not latest for target document'
    }
  })
}

/**
 * Delete a named document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} rev
 * @return {Promise}
 */
function deleteDocument (baseUrl, dbName, docId, rev) {
  return request({
    url: `${baseUrl}/${dbName}/${encodeURIComponent(docId)}?rev=${rev}`,
    method: 'DELETE',
    statusOk: {
      200: 'OK - Document successfully removed',
      202: 'Accepted - Request was accepted, but changes are not yet stored on disk'
    },
    statusNotOk: {
      400: 'Bad Request - Invalid request body or parameters',
      401: 'Unauthorized - Write privilege required',
      404: 'Not Found - Specified database or document ID doesn\'t exist',
      409: 'Conflict - Specified revision is not the latest for target document'
    }
  })
}

module.exports = {
  createDatabase,
  createDocument,
  deleteDocument,
  deleteDatabase,
  getDocument,
  listDatabases
}
