const throng = require('../../lib/throng')

throng({ worker, count: 4, lifetime: 0 })

function worker() {
    console.log('worker')
    process.exit()
}
