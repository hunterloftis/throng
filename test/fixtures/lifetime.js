'use strict';

var throng = require('../..');

const config = {
  workers: 3,
  lifetime: 500
};

throng(config, () => {
  console.log('worker');
  process.exit();
});
