var throng = require('../..');

throng(start, {
  workers: 3,
  lifetime: 250,
  memoryLimit: 1, // 1 Byte
  monitorInterval: 150 // Only want the process monitor to run once
});

function start() {
  console.log('worker');
  process.exit();
}
