const throng = require('./lib/throng');

throng({
  workers: 4,
  master: startMaster,
  start: startWorker
});

// This will only be called once
function startMaster() {
  console.log(`Started master`);

  process.on('beforeExit', () => {
    // `throng.shutdownSignal` will be `undefined` if the cluster exited without
    // being killed e.g. if the workers exited by themselves and `lifetime` is 0.
    console.log(`Master exiting in response to ${throng.shutdownSignal}...`);
    // Making async calls will keep the master alive.
    console.log('(master cleanup would happen here)');
  });
}

// This will be called four times
function startWorker(id) {
  console.log(`Started worker ${ id }`);

  process.on('SIGTERM', () => {
    console.log(`Worker ${ id } exiting...`);
    console.log('(cleanup would happen here)');
    process.exit();
  });
}
