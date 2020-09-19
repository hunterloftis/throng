const throng = require('./lib/throng');

throng({ workers: 4, master, start })

// This will only be called once
function master() {
  console.log(`Started master`);
}

// This will be called four times
function start(id) {
  console.log(`Started worker ${ id }`);

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  function shutdown() {
    process.removeAllListeners();
    console.log(`Worker ${ id } exiting...`);
    console.log('(cleanup would happen here)');
    process.exit();
  }
}
