const throng = require('./lib/throng');

throng({
  workers: 4,
  master: startMaster,
  start: startWorker
});

// This will only be called once
function startMaster() {
  console.log(`Started master`);
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
