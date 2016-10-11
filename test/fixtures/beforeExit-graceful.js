'use strict';

const throng = require('../../lib/throng');

throng({
  workers: 2,
  master: () => {
    console.log('master');
    
    process.on('beforeExit', () => {
      console.log(`Master exiting in response to ${throng.shutdownSignal}...`);
    });
  },
  start: () => {
    console.log('worker');
    
    process.on('SIGTERM', function() {
      console.log('exiting');
      process.exit();
    });
  }
});
