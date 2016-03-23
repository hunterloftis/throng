'use strict';

const throng = require('../../lib/throng');

const config = {
  workers: 3,
  lifetime: 0,
  grace: 250
};

throng(config, () => {
  console.log('ah ha ha ha');

  process.on('SIGTERM', function() {
    console.log('stayin alive');
  });
});
