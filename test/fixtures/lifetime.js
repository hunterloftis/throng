'use strict';

const throng = require('../../lib/throng');

const config = {
  workers: 3,
  lifetime: 500
};

throng(config, () => {
  console.log('worker');
  process.exit();
});
