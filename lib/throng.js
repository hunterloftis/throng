var os = require('os');
var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;

module.exports = function(startFn, options) {
  if (cluster.isWorker) return startFn(cluster.worker.id);

  options = options || {};

  var numWorkers = options.workers || os.cpus().length;
  var lifetime = options.lifetime || 0;
  var grace = options.grace || 5000;
  var emitter = new EventEmitter();
  var running = true;
  var runUntil = Date.now() + lifetime;

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
    for (var i = 0; i < numWorkers; i++) {
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
    setTimeout(forceKill, grace).unref();
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

