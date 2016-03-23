var throng = require('../..');

throng(3, () => {
  console.log('worker');
  process.exit();
});
