'use strict';

const throng = require('../../lib/throng');

throng({ lifetime: 0 }, () => {
  console.log('worker');
  process.exit();
});
