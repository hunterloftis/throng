'use strict';

const throng = require('../../lib/throng');

throng(3, () => {
  console.log('worker');

  process.once('SIGTERM', exit)
  process.once('SIGINT', exit)

  function exit() {
    process.removeAllListeners();
    console.log('exiting');
    process.exit();
  }
});
