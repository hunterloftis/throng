'use strict';

const throng = require('../../lib/throng');

throng({
    workers: 3,
    signals: ['SIGUSR2'],
    start: (id, disconnect) => {
        console.log('worker');

        process.on('SIGUSR2', exit);
      
        function exit() {
          console.log(`exiting`);
          disconnect()
        }
    }
  });
  