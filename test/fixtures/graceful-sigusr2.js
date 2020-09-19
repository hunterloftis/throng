'use strict';

const throng = require('../../lib/throng');

throng({
    workers: 3,
    signals: ['SIGUSR2'],
    start: () => {
        console.log('worker');

        process.once('SIGUSR2', exit);
      
        function exit() {
          process.removeAllListeners();
          console.log(`exiting`);
          process.exit();
        }
    }
  });
  