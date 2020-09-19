'use strict';

const cluster = require('cluster');
const defaults = require('lodash.defaults');
const cpuCount = require('os').cpus().length;

const DEFAULT_OPTIONS = {
  workers: cpuCount,
  lifetime: Infinity,
  grace: 5000,
  shutdown: ['SIGTERM', 'SIGINT']
};

const NOOP = () => {};

module.exports = function throng(options, startFunction) {
  options = options || {};
  let startFn = options.start || startFunction || options;
  let masterFn = options.master || NOOP;

  if (typeof startFn !== 'function') {
    throw new Error('Start function required');
  }
  if (cluster.isWorker) {
    return startFn(cluster.worker.id);
  }

  let opts = isNaN(options) ?
    defaults(options, DEFAULT_OPTIONS) : defaults({ workers: options }, DEFAULT_OPTIONS);
  let running = true;
  let runUntil = Date.now() + opts.lifetime;

  listen();
  masterFn();
  fork();

  function listen() {
    cluster.on('disconnect', revive);
    opts.shutdown.forEach(signal => process.on(signal, shutdown(signal)))
  }

  function fork() {
    for (var i = 0; i < opts.workers; i++) {
      cluster.fork();
    }
  }

  function shutdown(signal) {
    return () => {
      running = false;
      setTimeout(() => forceKill(signal), opts.grace).unref()
      
      Object.values(cluster.workers).forEach(w => {
        w.process.kill(signal)
      })
    }
  }

  function revive(worker, code, signal) {
    if (running && Date.now() < runUntil) cluster.fork();
  }

  function forceKill(signal) {
    Object.values(cluster.workers).forEach(w => w.kill(signal))
    process.exit()
  }
};
