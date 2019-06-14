#!/usr/bin/env node

'use strict'

// log to files
const logger = require('console-files')
// handle app authentication to Store API
// https://github.com/ecomclub/ecomplus-app-sdk
const { ecomAuth, ecomServerIps } = require('ecomplus-app-sdk')

// web server with Express
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const router = express.Router()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// E-Com Plus Store ID from request header
let storeId
app.use((req, res, next) => {
  if (req.baseUrl.startsWith('/ecom/') && process.env.NODE_ENV === 'production') {
    // check if request is comming from E-Com Plus servers
    if (ecomServerIps.indexOf(req.get('x-real-ip')) === -1) {
      res.status(403).send('Who are you? Unauthorized IP address')
    } else {
      // get store ID from request header
      storeId = parseInt(req.get('x-store-id'), 10)
      next()
    }
  } else {
    // bypass
    next()
  }
})

ecomAuth.then(appSdk => {
  // setup app routes
  const routes = './../routes'
  router.get('/', require(`${routes}/`)())

  // base routes for E-Com Plus Store API
  ;[ 'auth-callback', 'webhook' ].forEach(endpoint => {
    let filename = `/ecom/${endpoint}`
    router.post(filename, require(`${routes}${filename}`)(appSdk, storeId))
  })

  /* Add custom app routes here */

  // add router and start web server
  app.use(router)
  app.listen(port)
  logger.log(`--> Starting web app on port :${port}`)
})

ecomAuth.catch(err => {
  logger.error(err)
  setTimeout(() => {
    // destroy Node process while Store API auth cannot be handled
    process.exit(1)
  }, 1100)
})
