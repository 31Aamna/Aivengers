require('dotenv').config()

const { createApp } = require('./src/app')
const logger = require('./src/utils/logger')

const app = createApp()
const port = Number(process.env.PORT || 5000)
const host = process.env.HOST || '127.0.0.1'

const server = app.listen(port, host, () => {
  logger.info('server_started', { host, port })
})

server.on('error', (error) => {
  logger.error('server_error', {
    errorType: error.name,
    code: error.code,
    message: error.message,
  })
})
