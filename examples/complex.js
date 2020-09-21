const throng = require('../lib/throng')

throng({ master, worker, count: 4 })

// This will only be called once
function master() {
  console.log('Started master')

  process.on('beforeExit', () => {
    console.log('Master cleanup.')
  })
}

// This will be called four times
function worker(id, disconnect) {
  let exited = false

  console.log(`Started worker ${ id }`)
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  function shutdown() {
    if (exited) return
    exited = true
    console.log(`Worker ${ id } cleanup.`)
    disconnect()
  }
}