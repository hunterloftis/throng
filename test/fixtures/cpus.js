var throng = require('../..');

throng(start, { lifetime: 0 });

function start() {
  console.log('worker');
  process.exit();
}
