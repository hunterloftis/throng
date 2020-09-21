const throng = require('../lib/throng')

throng(id => console.log(`Started worker ${id}`))
