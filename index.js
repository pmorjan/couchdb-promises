// http://docs.couchdb.org/en/stable/api/index.html
'use strict'
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const urlParse = require('url').parse

// http://docs.couchdb.org/en/stable/api/basics.html#http-status-codes
const GENERIC_STATUS_CODES = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Resource Not Allowed',
  406: 'Not Acceptable',
  409: 'Conflict',
  412: 'Precondition Failed',
  415: 'Bad Content Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  500: 'Internal Server Error'
}
// https://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
const QUERY_KEYS_JSON = ['key', 'keys', 'startkey', 'endkey']

let requestTimeout = 10000 // ms

function isValidUrl (url) {
  const o = urlParse(url)
  if (
    ['http:', 'https:'].indexOf(o.protocol) === -1 ||
    o.slashes === false ||
    Number.isNaN(Number(o.port)) ||
    !o.hostname
  ) return false
  return true
}

function createQueryString (queryObj) {
  const obj = Object.assign({}, queryObj)
  Object.keys(obj).forEach((key) => {
    if (QUERY_KEYS_JSON.indexOf(key) !== -1) {
      obj[key] = JSON.stringify(obj[key])
    }
  })
  return Object.keys(obj).length ? '?' + querystring.stringify(obj) : ''
}

function request (param) {
  const method = param.method
  const url = param.url
  const statusCodes = param.statusCodes || {}
  const postData = param.postData
  const o = urlParse(url)
  const httpOptions = {
    hostname: o.host && o.host.split(':')[0],
    port: o.port || 443,
    path: o.path,
    auth: o.auth,
    protocol: o.protocol,
    method: method,
    headers: {
      'user-agent': 'couchdb-promises',
      accept: 'application/json'
    }
  }

  if (!isValidUrl(url)) {
    return Promise.reject({
      headers: {},
      data: new Error('Bad request'),
      status: 400,
      message: 'Error: Bad request'
    })
  }

  let body
  if (postData) {
    try {
      body = JSON.stringify(postData)
    } catch (err) {
      return Promise.reject({
        headers: {},
        data: err,
        status: 400,
        message: 'invalid document'
      })
    }
    httpOptions.headers['content-length'] = Buffer.byteLength(body)
    httpOptions.headers['content-type'] = 'application/json'
  }

  return new Promise(function (resolve, reject) {
    const lib = httpOptions.protocol === 'https:' ? https : http
    const req = lib.request(httpOptions, function (res) {
      let buffer = ''
      res.setEncoding('utf8')
      res.on('data', function (data) {
        buffer += data
      })
      res.on('end', function () {
        let ret
        try {
          ret = {
            headers: res.headers,
            data: JSON.parse(buffer || '{}'),
            status: res.statusCode,
            message: (statusCodes[res.statusCode] || GENERIC_STATUS_CODES[res.statusCode] || 'unknown status')
          }
        } catch (err) {
          ret = {
            headers: res.headers,
            data: err,
            status: 500,
            message: err.message || 'internal error'
          }
        }

        if (ret.status < 400) {
          resolve(ret)
        } else {
          reject(ret)
        }
      })
    })

    req.setTimeout(requestTimeout, function () {
      req.abort()
      reject({
        headers: {},
        data: new Error('request timed out'),
        status: 500,
        message: 'Error: request timed out'
      })
    })

    req.on('error', function (err) {
      reject({
        headers: {},
        data: err,
        status: 500,
        message: err.message || 'internal error'
      })
    })

    if (body) {
      req.write(body)
    }
    req.end()
  })
}

/**
 * set request timeout
 * @param {Number} t in ms
 * @return {Number}
 */
function setTimeout (t) {
  if (typeof t === 'number' && t >= 0) {
    requestTimeout = t
  }
  return requestTimeout
}

/**
 * get request timeout
 * @return {Number}
 */
function getTimeout () {
  return requestTimeout
}

/**
 * All promisses are settled  with an object with the folloing properties
 *  data:  {Object|String} - response from the database server
 *  status: {Number} - http status code
 *  message: {String} - http message
 */

/**
 * Get server info
 * @param  {String} baseUrl
 * @return {Promise}
 */
function getInfo (baseUrl) {
  return request({
    url: `${baseUrl}/`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully'
    }
  })
}

/**
 * Get the list of all databases.
 * @param  {String} baseUrl
 * @return {Promise}
 */
function listDatabases (baseUrl) {
  return request({
    url: `${baseUrl}/_all_dbs`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully'
    }
  })
}

/**
 * Create database
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @return {Promise}
 */
function createDatabase (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}`,
    method: 'PUT',
    statusCodes: {
      201: 'Created - Database created successfully',
      400: 'Bad Request - Invalid database name',
      401: 'Unauthorized - CouchDB Server Administrator privileges required',
      412: 'Precondition Failed - Database already exists'
    }
  })
}

/**
 * Delete database
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @return {Promise}
 */
function deleteDatabase (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}`,
    method: 'DELETE',
    statusCodes: {
      200: 'OK - Database removed successfully',
      400: 'Bad Request - Invalid database name or forgotten document id by accident',
      401: 'Unauthorized - CouchDB Server Administrator privileges required',
      404: 'Not Found - Database doesn’t exist'
    }
  })
}

/**
 * Get all documents
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {Object} [query]
 * @return {Promise}
 */
function getAllDocs (baseUrl, dbName, queryObj) {
  const queryStr = createQueryString(queryObj)
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_all_docs${queryStr}`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully'
    }
  })
}

/**
 * Get Document Head
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {Object} [query]
 * @return {Promise}
 */
function getDocumentHead (baseUrl, dbName, docId, queryObj) {
  const queryStr = createQueryString(queryObj)
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}${queryStr}`,
    method: 'HEAD',
    statusCodes: {
      200: 'OK - Document exists',
      304: 'Not Modified - Document wasn’t modified since specified revision',
      401: 'Unauthorized - Read privilege required',
      404: 'Not Found - Document not found'
    }
  })
}

/**
 * Get Document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {Object} [query]
 * @return {Promise}
 */
function getDocument (baseUrl, dbName, docId, queryObj) {
  const queryStr = createQueryString(queryObj)
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}${queryStr}`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully',
      304: 'Not Modified - Document wasn’t modified since specified revision',
      400: 'Bad Request - The format of the request or revision was invalid',
      401: 'Unauthorized - Read privilege required',
      404: 'Not Found - Document not found'
    }
  })
}

/**
 * Create a new document or new revision of an existing document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {Object} doc
 * @param  {String} [docId]
 * @return {Promise}
 */
function createDocument (baseUrl, dbName, doc, docId) {
  if (docId) {
    // create document by id (PUT)
    return request({
      url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}`,
      method: 'PUT',
      postData: doc,
      statusCodes: {
        201: 'Created – Document created and stored on disk',
        202: 'Accepted – Document data accepted, but not yet stored on disk',
        400: 'Bad Request – Invalid request body or parameters',
        401: 'Unauthorized – Write privileges required',
        404: 'Not Found – Specified database or document ID doesn’t exists',
        409: 'Conflict – Document with the specified ID already exists or specified revision is not latest for target document'
      }
    })
  } else {
    // create document without explicit id (POST)
    return request({
      url: `${baseUrl}/${encodeURIComponent(dbName)}`,
      method: 'POST',
      postData: doc,
      statusCodes: {
        201: 'Created – Document created and stored on disk',
        202: 'Accepted – Document data accepted, but not yet stored on disk',
        400: 'Bad Request – Invalid database name',
        401: 'Unauthorized – Write privileges required',
        404: 'Not Found – Database doesn’t exists',
        409: 'Conflict – A Conflicting Document with same ID already exists'
      }
    })
  }
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
    url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}?rev=${rev}`,
    method: 'DELETE',
    statusCodes: {
      200: 'OK - Document successfully removed',
      202: 'Accepted - Request was accepted, but changes are not yet stored on disk',
      400: 'Bad Request - Invalid request body or parameters',
      401: 'Unauthorized - Write privilege required',
      404: 'Not Found - Specified database or document ID doesn\'t exist',
      409: 'Conflict - Specified revision is not the latest for target document'
    }
  })
}

/**
 * Get one or more UUIDs
 * @param  {String} baseUrl
 * @param  {Number} [count = 1]
 * @return {Promise}
 */
function getUuids (baseUrl, count) {
  return request({
    url: `${baseUrl}/_uuids?count=${count || 1}`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully',
      403: 'Forbidden – Requested more UUIDs than is allowed to retrieve'
    }
  })
}

/**
 * Get design document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {Object} [query]
 * @return {Promise}
 */
function getDesignDocument (baseUrl, dbName, docId, queryObj) {
  const queryStr = createQueryString(queryObj)
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_design/${encodeURIComponent(docId)}${queryStr}`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully',
      304: 'Not Modified - Document wasn’t modified since specified revision',
      400: 'Bad Request - The format of the request or revision was invalid',
      401: 'Unauthorized - Read privilege required',
      404: 'Not Found - Document not found'
    }
  })
}

/**
 * Get design document info
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @return {Promise}
 */
function getDesignDocumentInfo (baseUrl, dbName, docId) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_design/${encodeURIComponent(docId)}/_info`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully'
    }
  })
}

/**
 * Create a new design document or new revision of an existing design document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {Object} doc
 * @param  {String} docId
 * @return {Promise}
 */
function createDesignDocument (baseUrl, dbName, doc, docId) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_design/${encodeURIComponent(docId)}`,
    method: 'PUT',
    postData: doc,
    statusCodes: {
      201: 'Created – Document created and stored on disk',
      202: 'Accepted – Document data accepted, but not yet stored on disk',
      400: 'Bad Request – Invalid request body or parameters',
      401: 'Unauthorized – Write privileges required',
      404: 'Not Found – Specified database or document ID doesn’t exists',
      409: 'Conflict – Document with the specified ID already exists or specified revision is not latest for target document'
    }
  })
}

/**
 * Delete a named design document
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} rev
 * @return {Promise}
 */
function deleteDesignDocument (baseUrl, dbName, docId, rev) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_design/${encodeURIComponent(docId)}?rev=${rev}`,
    method: 'DELETE',
    statusCodes: {
      200: 'OK - Document successfully removed',
      202: 'Accepted - Request was accepted, but changes are not yet stored on disk',
      400: 'Bad Request - Invalid request body or parameters',
      401: 'Unauthorized - Write privilege required',
      404: 'Not Found - Specified database or document ID doesn\'t exist',
      409: 'Conflict - Specified revision is not the latest for target document'
    }
  })
}

/**
 * Get view
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} viewName
 * @param  {Object} [query]
 * @return {Promise}
 */
function getView (baseUrl, dbName, docId, viewName, queryObj) {
  const queryStr = createQueryString(queryObj)
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_design/${encodeURIComponent(docId)}/_view/${encodeURIComponent(viewName)}${queryStr}`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully'
    }
  })
}

/**
 * Bulk docs
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {Array} docs
 * @param  {Object} [opts]
 * @return {Promise}
 */
function bulkDocs (baseUrl, dbName, docs, opts) {
  const obj = {
    docs: docs
  }
  Object.assign(obj, opts)
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_bulk_docs`,
    method: 'POST',
    postData: obj,
    statusCodes: {
      201: 'Created – Document(s) have been created or updated',
      400: 'Bad Request – The request provided invalid JSON data',
      417: 'Expectation Failed – Occurs when all_or_nothing option set as true and at least one document was rejected by validation function',
      500: 'Internal Server Error – Malformed data provided, while it’s still valid JSON'
    }
  })
}

module.exports = {
  setTimeout: setTimeout,
  getTimeout: getTimeout,
  //
  bulkDocs: bulkDocs,
  createDatabase: createDatabase,
  createDesignDocument: createDesignDocument,
  createDocument: createDocument,
  deleteDatabase: deleteDatabase,
  deleteDesignDocument: deleteDesignDocument,
  deleteDocument: deleteDocument,
  getAllDocs: getAllDocs,
  getDesignDocument: getDesignDocument,
  getDesignDocumentInfo: getDesignDocumentInfo,
  getDocument: getDocument,
  getDocumentHead: getDocumentHead,
  getUuids: getUuids,
  getInfo: getInfo,
  getView: getView,
  listDatabases: listDatabases
}
