'use strict';

const throng = require('../../lib/throng');

throng(3, () => {
  console.log('worker');

  process.on('SIGTERM', function() {
    console.log('exiting');
    process.exit();
  });
});
