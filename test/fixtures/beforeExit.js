'use strict';

const throng = require('../../lib/throng');

throng({
  lifetime: 0,
  workers: 2,
  master: () => {
    console.log('master');

    process.on('beforeExit', () => {
      console.log(`Master exiting in response to ${throng.shutdownSignal}...`);
    });
  },
  start: () => {
    console.log('worker');
    process.exit();
  }
});
