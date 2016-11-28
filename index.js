// http://docs.couchdb.org/en/stable/api/index.html
'use strict'
const assert = require('assert')
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const urlParse = require('url').parse

// https://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
const QUERY_KEYS_JSON = ['key', 'keys', 'startkey', 'endkey']

let requestTimeout = 10000 // ms

function isValidUrl (url) {
  const o = urlParse(url)
  if (
    ['http:', 'https:'].indexOf(o.protocol) >= 0 &&
    o.slashes === true &&
    !Number.isNaN(parseInt(o.port, 10)) &&
    o.hostname
  ) return true
  return false
}

function createQueryString (queryObj) {
  const obj = Object.assign({}, queryObj)
  QUERY_KEYS_JSON.forEach(key => {
    if (key in obj) {
      obj[key] = JSON.stringify(obj[key])
    }
  })
  return Object.keys(obj).length ? `?${querystring.stringify(obj)}` : ''
}

function request (param) {
  const t0 = Date.now()
  const method = param.method
  const url = param.url
  const statusCodes = param.statusCodes || {}
  const postData = param.postData
  const postContentType = param.postContentType
  const o = urlParse(url)
  const httpOptions = {
    hostname: o.host && o.host.split(':')[0],
    port: o.port,
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
      message: 'Error: Bad request',
      duration: Date.now() - t0
    })
  }

  let body
  let stream
  let error

  if (Buffer.isBuffer(postData)) {
    //
    // buffer
    //
    body = postData
    httpOptions.headers['content-type'] = postContentType
    httpOptions.headers['content-length'] = Buffer.byteLength(postData)
  } else if (postData && postData.readable && typeof postData._read === 'function') {
    //
    // stream
    //
    httpOptions.headers['content-type'] = postContentType
    httpOptions.headers['Transfer-Encoding'] = 'chunked'
    stream = postData
  } else if (Object.prototype.toString.call(postData) === '[object Object]') {
    //
    // regular object -> JSON
    //
    try {
      body = JSON.stringify(postData)
    } catch (err) {
      error = err
    }
    httpOptions.headers['content-type'] = 'application/json'
    httpOptions.headers['content-length'] = Buffer.byteLength(body)
  } else if (typeof postData === 'string') {
    //
    // string
    //
    body = postData
    httpOptions.headers['content-type'] = postContentType
    httpOptions.headers['content-length'] = body.length
  } else if (postData) {
    error = 'unsoported post data'
  }

  if (error) {
    return Promise.reject({
      headers: {},
      data: error,
      status: 400,
      message: 'invalid post data',
      duration: Date.now() - t0
    })
  }

  return new Promise(function (resolve, reject) {
    const lib = httpOptions.protocol === 'https:' ? https : http
    const req = lib.request(httpOptions, function (res) {
      // console.error(url)
      // console.error(res.req._headers)
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
            message: (statusCodes[res.statusCode] || http.STATUS_CODES[res.statusCode] || 'unknown status'),
            duration: Date.now() - t0
          }
        } catch (err) {
          ret = {
            headers: res.headers,
            data: err,
            status: 500,
            message: err.message || 'internal error',
            duration: Date.now() - t0
          }
        }

        if (ret.status < 400) {
          return resolve(ret)
        } else {
          return reject(ret)
        }
      })
    })

    req.setTimeout(requestTimeout, function () {
      req.abort()
      reject({
        headers: {},
        data: new Error('request timed out'),
        status: 500,
        message: 'Error: request timed out',
        duration: Date.now() - t0
      })
    })

    req.on('error', function (err) {
      reject({
        headers: {},
        data: err,
        status: 500,
        message: err.message || 'internal error',
        duration: Date.now() - t0
      })
    })

    if (body) {
      req.write(body)
      req.end()
    } else if (stream) {
      stream.on('data', function (chunk) {
        req.write(chunk)
      })
      stream.on('end', function () {
        req.end()
      })
    } else {
      req.end()
    }
  })
}

function requestStream (param) {
  const t0 = Date.now()
  const url = param.url
  const statusCodes = param.statusCodes || {}
  const stream = param.stream

  assert(stream && stream.writable && typeof stream.pipe === 'function', 'is writeable stream')

  const o = urlParse(url)
  const httpOptions = {
    hostname: o.host && o.host.split(':')[0],
    port: o.port || 443,
    path: o.path,
    auth: o.auth,
    protocol: o.protocol,
    method: 'GET',
    headers: {
      'user-agent': 'couchdb-promises'
    }
  }

  if (!isValidUrl(url)) {
    return Promise.reject({
      headers: {},
      data: new Error('Bad request'),
      status: 400,
      message: 'Error: Bad request',
      duration: Date.now() - t0
    })
  }

  return new Promise(function (resolve, reject) {
    const lib = httpOptions.protocol === 'https:' ? https : http
    const req = lib.request(httpOptions, function (res) {
      res.pipe(stream)
      const ret = {
        headers: res.headers,
        status: res.statusCode,
        message: (statusCodes[res.statusCode] || http.STATUS_CODES[res.statusCode] || 'unknown status'),
        duration: Date.now() - t0
      }

      if (ret.status < 400) {
        return resolve(ret)
      } else {
        return reject(ret)
      }
    })

    req.setTimeout(requestTimeout, function () {
      req.abort()
      reject({
        headers: {},
        data: new Error('request timed out'),
        status: 500,
        message: 'Error: request timed out',
        duration: Date.now() - t0
      })
    })

    req.on('error', function (err) {
      reject({
        headers: {},
        data: err,
        status: 500,
        message: err.message || 'internal error',
        duration: Date.now() - t0
      })
    })

    req.end()
  })
}

const couch = module.exports = {}

/**
 * set request timeout
 * @param {Number} t in ms
 * @return {Number}
 */
couch.setTimeout = function setTimeout (t) {
  if (typeof t === 'number' && t >= 0) {
    requestTimeout = t
  }
  return requestTimeout
}

/**
 * get request timeout
 * @return {Number}
 */
couch.getTimeout = function getTimeout () {
  return requestTimeout
}

/**
 * All promisses are settled  with an object with the folloing properties
 *  headers: {Object} - response headers
 *  data:  {Object} - response body from the database server
 *  status: {Number} - http status code
 *  message: {String} - http message
 */

/**
 * Get server info
 * @param  {String} baseUrl
 * @return {Promise}
 */
couch.getInfo = function getInfo (baseUrl) {
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
couch.listDatabases = function listDatabases (baseUrl) {
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
couch.createDatabase = function createDatabase (baseUrl, dbName) {
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
 * Get database
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @return {Promise}
 */
couch.getDatabase = function getDatabase (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Request completed successfully',
      404: 'Not Found – Requested database not found'
    }
  })
}

/**
 * Get database head
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @return {Promise}
 */
couch.getDatabaseHead = function getDatabaseHead (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}`,
    method: 'HEAD',
    statusCodes: {
      200: 'OK - Database exists',
      404: 'Not Found – Requested database not found'
    }
  })
}

/**
 * Delete database
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @return {Promise}
 */
couch.deleteDatabase = function deleteDatabase (baseUrl, dbName) {
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
couch.getAllDocuments = function getAllDocuments (baseUrl, dbName, queryObj) {
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
couch.getDocumentHead = function getDocumentHead (baseUrl, dbName, docId, queryObj) {
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
couch.getDocument = function getDocument (baseUrl, dbName, docId, queryObj) {
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
couch.createDocument = function createDocument (baseUrl, dbName, doc, docId) {
  if (docId) {
    // create document by id (PUT)
    return request({
      url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}`,
      method: 'PUT',
      postData: doc,
      postContentType: 'application/json',
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
couch.deleteDocument = function deleteDocument (baseUrl, dbName, docId, rev) {
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
 * Find documents (requires CouchDB >= 2.0.0)
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {Object} queryObj
 * @return {Promise}
 */
couch.findDocuments = function findDocuments (baseUrl, dbName, queryObj) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_find`,
    method: 'POST',
    postData: queryObj,
    statusCodes: {
      200: 'OK - Request completed successfully',
      400: 'Bad Request - Invalid request',
      401: 'Unauthorized - Read permission required',
      500: 'Internal Server Error - Query execution error'
    }
  })
}

/**
 * Get one or more UUIDs
 * @param  {String} baseUrl
 * @param  {Number} [count = 1]
 * @return {Promise}
 */
couch.getUuids = function getUuids (baseUrl, count) {
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
couch.getDesignDocument = function getDesignDocument (baseUrl, dbName, docId, queryObj) {
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
couch.getDesignDocumentInfo = function getDesignDocumentInfo (baseUrl, dbName, docId) {
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
couch.createDesignDocument = function createDesignDocument (baseUrl, dbName, doc, docId) {
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
couch.deleteDesignDocument = function deleteDesignDocument (baseUrl, dbName, docId, rev) {
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
couch.getView = function getView (baseUrl, dbName, docId, viewName, queryObj) {
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
couch.createBulkDocuments = function createBulkDocuments (baseUrl, dbName, docs, opts) {
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

// http://docs.couchdb.org/en/latest/api/document/common.html#attachments

/**
 * Get attachment head
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} attName
 * @param  {String} [rev]
 * @return {Promise}
 */
couch.getAttachmentHead = function getAttachmentHead (baseUrl, dbName, docId, attName, rev) {
  const queryStr = rev ? `?rev=${rev}` : ''
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}/${encodeURIComponent(attName)}${queryStr}`,
    method: 'HEAD',
    statusCodes: {
      200: 'OK - Attachment exists',
      304: 'Not Modified - Attachment wasn’t modified if ETag equals specified If-None-Match header',
      401: 'Unauthorized - Read privilege required',
      404: 'Not Found - Specified database, document or attchment was not found'
    }
  })
}

/**
 * get attachment
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} attName
 * @param  {StreamWritable} stream
 * @param  {String} [rev]
 * @return {Promise}
 */
couch.getAttachment = function getAttachment (baseUrl, dbName, docId, attName, stream, rev) {
  const queryStr = rev ? `?rev=${rev}` : ''
  return Promise.resolve()
    .then(() => requestStream({
      url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}/${encodeURIComponent(attName)}${queryStr}`,
      stream: stream,
      statusCodes: {
        200: 'OK - Attachment exists',
        304: 'Not Modified - Attachment wasn’t modified if ETag equals specified If-None-Match header',
        401: 'Unauthorized - Read privilege required',
        404: 'Not Found - Specified database, document or attchment was not found'
      }
    })
    .then(response => new Promise(function (resolve, reject) {
      stream.on('close', function () {
        return resolve(response)
      })
      stream.on('error', function (err) {
        return reject({
          headers: {},
          data: err,
          status: 500,
          message: err.message || 'stream error'
        })
      })
    }))
  )
}

/**
 * add attachment
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} attName
 * @param  {String} rev
 * @param  {String} contentType
 * @param  {Buffer|String} att
 * @return {Promise}
 */
couch.addAttachment = function addAttachment (baseUrl, dbName, docId, attName, rev, contentType, data) {
  const queryStr = rev ? `?rev=${rev}` : ''
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}/${encodeURIComponent(attName)}${queryStr}`,
    method: 'PUT',
    postContentType: contentType,
    postData: data,
    statusCodes: {
      201: 'OK - Created',  // TODO: check with API again
      202: 'Accepted - Request was but changes are not yet stored on disk',
      401: 'Unauthorized - Write privilege required',
      404: 'Not Found - Specified database, document or attchment was not found',
      409: '409 Conflict – Document’s revision wasn’t specified or it’s not the latest'
    }
  })
}

/**
 * delete attachment
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId
 * @param  {String} attName
 * @param  {String} rev
 * @return {Promise}
 */
couch.deleteAttachment = function deleteAttachment (baseUrl, dbName, docId, attName, rev) {
  const queryStr = rev ? `?rev=${rev}` : ''
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/${encodeURIComponent(docId)}/${encodeURIComponent(attName)}${queryStr}`,
    method: 'DELETE',
    statusCodes: {
      200: 'OK – Attachment successfully removed',
      202: 'Accepted - Request was but changes are not yet stored on disk',
      400: '400 Bad Request – Invalid request body or parameters',
      401: 'Unauthorized - Write privilege required',
      404: 'Not Found - Specified database, document or attchment was not found',
      409: '409 Conflict – Document’s revision wasn’t specified or it’s not the latest'
    }
  })
}

/**
 * create index (requires CouchDB >= 2.0.0)
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {Object} queryObj
 * @return {Promise}
 */
couch.createIndex = function createIndex (baseUrl, dbName, queryObj) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_index`,
    method: 'POST',
    postData: queryObj,
    statusCodes: {
      200: 'OK - Index created successfully or already exists',
      400: 'Bad Request - Invalid request',
      401: 'Unauthorized - Admin permission required',
      500: 'Internal Server Error - Execution error'
    }
  })
}

/**
 * get index (requires CouchDB >= 2.0.0)
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @return {Promise}
 */
couch.getIndex = function getIndex (baseUrl, dbName) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_index`,
    method: 'GET',
    statusCodes: {
      200: 'OK - Success',
      400: 'Bad Request - Invalid request',
      401: 'Unauthorized - Read permission required',
      500: 'Internal Server Error - Execution error'
    }
  })
}

/**
 * delete index (requires CouchDB >= 2.0.0)
 * @param  {String} baseUrl
 * @param  {String} dbName
 * @param  {String} docId - design document id
 * @param  {String} name - index name
 * @return {Promise}
 */
couch.deleteIndex = function deleteIndex (baseUrl, dbName, docId, name) {
  return request({
    url: `${baseUrl}/${encodeURIComponent(dbName)}/_index/${encodeURIComponent(docId)}/json/${encodeURIComponent(name)}`,
    method: 'DELETE',
    statusCodes: {
      200: 'OK - Success',
      400: 'Bad Request - Invalid request',
      401: 'Unauthorized - Writer permission required',
      404: 'Not Found - Index not found',
      500: 'Internal Server Error - Execution error'
    }
  })
}

/**
 * generic request function
 * @param  {String} url    e.g. http://localhost:5948/_all_dbs
 * @return {Promise}
 */
couch.getUrl = function (url) {
  return request({
    url: url,
    methode: 'GET'
  })
}

//
// aliases for backward compatibility
//
couch.bulkDocs = couch.createBulkDocuments
couch.getAllDocs = couch.getAllDocuments
