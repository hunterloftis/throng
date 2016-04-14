'use strict';

const throng = require('../../lib/throng');

throng({
  lifetime: 0,
  start: () => {
    console.log('worker');
    process.exit();
  }
});
