const cluster = require('cluster')
const os = require('os')
const defaultsDeep = require('lodash').defaultsDeep

const nCPU = os.cpus().length
const defaults = {
  master: () => {},
  count: nCPU,
  lifetime: Infinity,
  grace: 5000,
  signals: ['SIGTERM', 'SIGINT'],
}

module.exports = async function throng(options, legacy) {
  const config = defaultsDeep({}, parseOptions(options, legacy), defaults)
  const worker = config.worker
  const master = config.master

  if (typeof worker !== 'function') {
    throw new Error('Start function required');
  }

  if (cluster.isWorker) {
    return await worker(cluster.worker.id)
  }

  const reviveUntil = Date.now() + config.lifetime
  let running = true
  
  listen()
  await master()
  fork(config.count)

  function listen() {
    cluster.on('disconnect', revive)
    config.signals.forEach(signal => process.on(signal, shutdown(signal)))
  }

  function shutdown(signal) {
    return () => {
      running = false
      setTimeout(() => forceKill(signal), config.grace).unref()
      
      Object.values(cluster.workers).forEach(w => {
        w.process.kill(signal)
      })
    }
  }

  function revive() {
    if (running && Date.now() < reviveUntil) cluster.fork()
  }

  function forceKill(signal) {
    Object.values(cluster.workers).forEach(w => w.kill(signal))
    process.exit()
  }
}

function fork(n) {
  for (var i = 0; i < n; i++) {
    cluster.fork()
  }
}

// Once upon a time,
// options could be startFn, options object, or worker count
// and startFunction could be startFn or options object.
// (whew - what a bad idea!)

function parseOptions(options = {}, startFunction) {
  if (typeof options === 'function') {
    return { worker: options }
  }
  if (typeof options === 'number') {
    return { count: options, worker: startFunction }
  }
  return {
    master: options.master,
    worker: options.worker || options.start,
    count: options.count !== undefined ? options.count : options.workers,
    lifetime: options.lifetime,
    grace: options.grace,
    signals: options.signals,
  }
}