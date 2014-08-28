var throng = require('../..');

throng(start, {
  workers: 3,
  lifetime: 0,
  grace: 250
});

function start() {
  console.log('ah ha ha ha');

  process.on('SIGTERM', function() {
    console.log('stayin alive');
  });
}
