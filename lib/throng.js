'use strict';

const cluster = require('cluster');
const EventEmitter = require('events').EventEmitter;
const defaults = require('lodash.defaults');
const cpuCount = require('os').cpus().length;

const DEFAULT_OPTIONS = {
  workers: cpuCount,
  lifetime: Infinity,
  grace: 5000
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
  let emitter = new EventEmitter();
  let running = true;
  let runUntil = Date.now() + opts.lifetime;

  listen();
  masterFn();
  fork();

  function listen() {
    cluster.on('exit', revive);
    emitter.once('shutdown', shutdown);
    var shutdownSignals = ['SIGINT', 'SIGTERM'];
    if (opts.extraShutdownSignal) shutdownSignals.push(opts.extraShutdownSignal);
    shutdownSignals.forEach((signal) => {
      process.once(signal, () => emitter.emit('shutdown', signal));
    });
  }

  function fork() {
    for (var i = 0; i < opts.workers; i++) {
      cluster.fork();
    }
  }

  function shutdown(signal) {
    running = false;
    module.exports.shutdownSignal = signal;
    for (var id in cluster.workers) {
      cluster.workers[id].process.kill();
    }

    // Unref'ing the timer ensures that the only thing keeping the master alive
    // (as far as this module knows) are the connections to the child processes.
    // When they disconnect (either because they exit voluntarily or because
    // we disconnect them with `Worker#kill`), we'll receive the 'exit' event.
    // Kill with the shutdown signal to respect signal exit codes: 
    // https://nodejs.org/api/process.html#process_exit_codes
    setTimeout(forceKill, opts.grace).unref();
    process.on('exit', () => process.kill(process.pid, signal));
  }

  function revive(worker, code, signal) {
    if (running && Date.now() < runUntil) cluster.fork();
  }

  function forceKill() {
    for (var id in cluster.workers) {
      cluster.workers[id].kill();
    }
  }
};
