var throng = require('../..');

throng(start, { workers: 3 });

function start() {
  console.log('worker');

  process.on('SIGTERM', function() {
    console.log('exiting');
    process.exit();
  });
}
