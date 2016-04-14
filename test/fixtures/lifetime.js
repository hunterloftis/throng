'use strict';

const throng = require('../../lib/throng');

throng({
  workers: 3,
  lifetime: 500,
  start: () => {
    console.log('worker');
    process.exit();
  }
});
