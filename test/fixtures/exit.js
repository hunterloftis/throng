'use strict';

const throng = require('../lib/throng');

const config = {
  workers: 3,
  lifetime: 0
};

throng(config, () => {
  console.log('worker');
  process.exit();
});
