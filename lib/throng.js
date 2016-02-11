var os = require('os');
var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var defaults = require('lodash').defaults;

var DEFAULT_OPTIONS = {
  workers: os.cpus().length,
  lifetime: Infinity,
  grace: 5000
};

module.exports = function(startFn, options) {
  if (cluster.isWorker) return startFn(cluster.worker.id);

  options = defaults(options, DEFAULT_OPTIONS);

  var emitter = new EventEmitter();
  var running = true;
  var runUntil = Date.now() + options.lifetime;

  listen();
  fork();

  function listen() {
    cluster.on('exit', revive);
    emitter.once('shutdown', shutdown);
    process
      .on('SIGINT', proxySignal)
      .on('SIGTERM', proxySignal);
  }

  function fork() {
    for (var i = 0; i < options.workers; i++) {
      cluster.fork();
    }
  }

  function proxySignal() {
    emitter.emit('shutdown');
  }

  function shutdown() {
    running = false;
    for (var id in cluster.workers) {
      cluster.workers[id].process.kill();
    }
    setTimeout(forceKill, options.grace).unref();
  }

  function revive(worker, code, signal) {
    if (running && Date.now() < runUntil) cluster.fork();
  }

  function forceKill() {
    for (var id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit();
  }
};
