var throng = require('../..');

throng(start, { workers: 3, lifetime: 0 });

function start() {
  console.log('worker');
  process.exit();
}
