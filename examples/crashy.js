const throng = require('../lib/throng')

throng({ worker, count: 4 })

function worker(id) {
    setInterval(() => process.stdout.write(`-${id}-`), 1000)
    setTimeout(() => { 
        process.stdout.write('-crash!-')
        process.exit()
    }, Math.random() * 5000 + 5000)
}
