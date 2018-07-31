'use strict';

const cluster = require('cluster');
const EventEmitter = require('events').EventEmitter;
const defaults = require('lodash/defaults');
const cpuCount = require('os').cpus().length;

const DEFAULT_OPTIONS = {
  workers: cpuCount,
  lifetime: Infinity,
  grace: 5000
};

const NOOP = () => {};

module.exports = function throng(options, startFunction) {
  options = options || {};
  const startFn = options.start || startFunction || options;
  const masterFn = options.master || NOOP;

  if (typeof startFn !== 'function') {
    throw new Error('Start function required');
  }
  const externEmitter = new EventEmitter();
  if (cluster.isWorker) {
    startFn(cluster.worker.id);
    // Return the noop emitter for a consistent API.
    return externEmitter;
  }

  const opts = isNaN(options) ?
    defaults(options, DEFAULT_OPTIONS) : defaults({ workers: options }, DEFAULT_OPTIONS);
  const runUntil = Date.now() + opts.lifetime;

  let running = true;

  listen();
  masterFn();
  fork();

  function listen() {
    cluster.on('disconnect', revive);
    cluster.on('disconnect', (worker) => externEmitter.emit('disconnect', worker.id));
    cluster.on('exit', (worker) => externEmitter.emit('exit', worker.id));
    const shutdownSignals = ['SIGINT', 'SIGTERM'];
    if (opts.extraShutdownSignal) shutdownSignals.push(opts.extraShutdownSignal);
    shutdownSignals.forEach((signal) => {
      process.once(signal, () => shutdown(signal));
    });
  }

  function fork() {
    for (let i = 0; i < opts.workers; i++) {
      cluster.fork();
    }
  }

  function shutdown(signal) {
    running = false;
    module.exports.shutdownSignal = signal;
    externEmitter.shutdownSignal = signal;
    for (const id in cluster.workers) {
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
    setTimeout(forceKillWorker, opts.grace, worker).unref();
    if (running && Date.now() < runUntil) cluster.fork();
  }

  function forceKill() {
    for (const id in cluster.workers) {
      forceKillWorker(cluster.workers[id]);
    }
  }

  function forceKillWorker(worker) {
    if (!worker.isDead()) worker.kill('SIGKILL');
  }

  return externEmitter;
};
