const throng = require('./lib/throng');

throng(3, (id) => {
  console.log(`Started worker ${id}`);
});
