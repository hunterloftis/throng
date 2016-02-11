var throng = require('../..');

throng(start, { workers: 3, lifetime: 500 });

function start() {
  console.log('worker');
  process.exit();
}
