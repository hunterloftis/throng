var throng = require('../..');

throng(3, () => {
  console.log('worker');

  process.on('SIGTERM', function() {
    console.log('exiting');
    process.exit();
  });  
});
