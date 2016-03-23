var throng = require('../..');

throng({ lifetime: 0 }, () => {
  console.log('worker');
  process.exit();
});
