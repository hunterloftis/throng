const throng = require('../lib/throng')

throng({ master, worker, count: 4 })

// This will only be called once
function master() {
  console.log('Started master')

  process.once('beforeExit', () => {
    console.log('Master cleanup.')
  })
}

// This will be called four times
function worker(id, disconnect) {
  console.log(`Started worker ${ id }`)
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)

  function shutdown() {
    console.log(`Worker ${ id } cleanup.`)
    disconnect()
  }
}