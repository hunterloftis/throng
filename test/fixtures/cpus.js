var throng = require('../..');

throng(start);

function start() {
  console.log('worker');
  process.exit();
}
