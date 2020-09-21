'use strict';

const throng = require('../../lib/throng');

throng(3, (id, disconnect) => {
  let exited = false

  console.log('worker');

  process.on('SIGTERM', exit)
  process.on('SIGINT', exit)

  async function exit() {
    if (exited) return
    exited = true
    console.log('exiting')
    disconnect()
  }
});
