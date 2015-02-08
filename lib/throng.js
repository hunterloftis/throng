var os = require('os');
var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;

// extend cluster fork method for supporting environment
cluster.__fork = cluster.fork;
cluster.fork = function(env) {
  env = env || {};
  var res = cluster.__fork.apply(this, arguments);
  var keys = Object.keys(cluster.workers || {});
  if (keys.length > 0) {
    cluster.workers[keys[keys.length - 1]].env = env;
  }
  return res;
};

module.exports = function(startFn, options) {
  if (cluster.isWorker) return startFn();

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
      cluster.fork({
        index: i
      });
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
    var index = worker.env.index;
    console.log('aaaaaaeeeee', code, signal);
    if (running && Date.now() < runUntil) {
      cluster.fork({
        index: index
      });
    } else if ((signal !== 'SIGKILL') && code !== 130) {
      /**
       * Code signal 130 is Ctrl+C, SIGKILL is kill -9 <pid>
       * Reference:
       * http://people.cs.pitt.edu/~alanjawi/cs449/code/shell/UnixSignals.htm
       * http://nodejs.org/api/process.html#process_exit_codes
       * http://tldp.org/LDP/abs/html/exitcodes.html
       */
      console.log('CRITICAL', 'Restarting worker', worker.env.index);
      cluster.fork({
        index: index
      });
    }
  }

  function forceKill() {
    for (var id in cluster.workers) {
      cluster.workers[id].kill();
    }
  }
};
