'use strict';

const throng = require('../../lib/throng');
const cluster = require('cluster')

throng({
  lifetime: 0,
  workers: 2,
  master: () => {
    if (cluster.schedulingPolicy === cluster.SCHED_RR) {
      console.log('master')
    }
  },
  start: () => {
    console.log('worker');
    process.exit();
  }
});