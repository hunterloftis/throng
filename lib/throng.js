var os = require('os');
var cluster = require('cluster');
var pidusage = require('pidusage');
var EventEmitter = require('events').EventEmitter;

module.exports = function(startFn, options) {
  if (cluster.isWorker) return startFn();

  options = options || {};

  var numWorkers = options.workers || os.cpus().length;
  var lifetime = options.lifetime || 0;
  var grace = options.grace || 5000;
  var emitter = new EventEmitter();
  var running = true;
  var runUntil = Date.now() + lifetime;
  var monitorInterval = options.monitorInterval || 30000;
  var monitorTimer = null;

  listen();
  fork();
  monitor();

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
    
    if (monitorTimer !== null) {
      clearInterval(monitorTimer);
    }

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

  function monitor() {
    function verifyMemory(worker, pid) {
      pidusage.stat(pid, function(err, stat) {
        if (err) return;

        var memoryUsage = Math.floor(stat.memory);

        if (memoryUsage > options.memoryLimit) {
          console.log('killing process with pid ' + pid + ' for excessive memory usage')
          worker.process.kill();
        }
      });
    }

    if (options.memoryLimit) {
      function monitorMemory() {
        for(var id in cluster.workers) {
          var worker = cluster.workers[id];
          var pid = worker.process.pid;

          verifyMemory(worker, pid);
        }
      }

      monitorTimer = setInterval(monitorMemory, monitorInterval).unref();
    }
  }
};
