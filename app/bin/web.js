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
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use((req, res, next) => {
  if (req.baseUrl.startsWith('/ecom/') && process.env.NODE_ENV === 'production') {
    // check if request is comming from E-Com Plus servers
    if (ecomServerIps.indexOf(req.get('x-real-ip')) === -1) {
      res.status(403).send('Who are you? Unauthorized IP address')
    } else {
      next()
    }
  } else {
    // bypass
    next()
  }
})

ecomAuth.then(appSdk => {
  // setup app routes
  require('./../routes/')(appSdk)
})

app.listen(port)
logger.log(`--> Starting web app on port :${port}`)
