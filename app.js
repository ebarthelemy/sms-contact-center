'use strict'

// Config
require('./config/config')

// Node modules
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const twilio = require('twilio')
const flybase = require('flybase')
const path = require('path')

// App
let app = express()

app.set('views', path.join(process.cwd(), 'views'))
app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(`${__dirname}/public`))

let port = process.env.PORT || 8080 // set our port

// Twilio
let twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)
let twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Flybase
let messagesRef = flybase.init(
  process.env.FLYBASE_APP_NAME,
  process.env.FLYBASE_COLLECTION,
  process.env.FLYBASE_API_KEY
)

// Back-end routes
app.post('/message', (request, response) => {
    let date = new Date()
    date = date.toLocaleString()

    let message = {
      sid: request.param('MessageSid'),
      type: 'text',
      direction: 'inbound',
      date: date,
      fromNumber: request.param('From'),
      textMessage: request.param('Body'),
      fromCity: request.param('FromCity'),
      fromState: request.param('FromState'),
      fromCountry: request.param('FromCountry')
    }

    console.log('message', message)

    let result = messagesRef.push(message)

    console.log('result', result)

    let twimlResponse = new twilio.TwimlResponse()
    twimlResponse.message('Thanks for the message, an agent will get back to you shortly.') // TwiML Message verb
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.end(twimlResponse.toString())
})

app.post('/reply', (request, response) => {
  let date = new Date()
  date = date.toLocaleString()

  let message = {
    type: 'text',
    direction: 'outbound',
    date: date,
    fromNumber: request.param('From'),
    textMessage: request.param('Body'),
    fromCity: '',
    fromState: '',
    fromCountry: ''
  }

  messagesRef.push(message)

  twilioClient.sendMessage({
    to: request.param('To'),
    from: twilioPhoneNumber,
    body: request.param('Body')
  }, (err, data) => {
    console.log(data.body)
  })
})

// Front-end routes

// Route to handle all Angular requests
app.get('*', (re, res) => {
  res.render('home', {
    flybaseApiKey: process.env.FLYBASE_API_KEY,
    flybaseAppName: process.env.FLYBASE_APP_NAME,
    flybaseCollection: process.env.FLYBASE_COLLECTION
  })
})

// Server
let server = app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
})
