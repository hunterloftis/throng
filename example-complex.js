const throng = require('./lib/throng')

throng({ master, worker, count: 4 })

// This will only be called once
function master() {
  process.once('beforeExit', cleanup)
  
  console.log(`Started master`)

  function cleanup() {
    console.log(`Master cleanup goes here.`)
  }
}

// This will be called four times
function worker(id, disconnect) {
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)

  console.log(`Started worker ${ id }`)

  function shutdown() {
    console.log(`Worker ${ id } cleanup goes here.`)
    disconnect()
  }
}
