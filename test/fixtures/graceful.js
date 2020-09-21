'use strict';

const throng = require('../../lib/throng');

throng(3, (id, disconnect) => {
  console.log('worker');

  process.once('SIGTERM', exit)
  process.once('SIGINT', exit)

  async function exit() {
    console.log('exiting')
    disconnect()
  }
});
