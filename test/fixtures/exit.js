'use strict';

const throng = require('../..');

const config = {
  workers: 3,
  lifetime: 0
};

throng(config, () => {
  console.log('worker');
  process.exit();
});
