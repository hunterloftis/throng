const throng = require('../lib/throng')

throng({ worker, count: 4 })

function worker(id) {
    setInterval(() => process.stdout.write(`-${id}-`), 1000)
    setTimeout(() => { 
        process.stdout.write('-crash!-')
        // Different ways to crash the process...all will emit `disconnect`
        // throw new Error()
        // Promise.reject()
        // process.emit('error')
        // process.kill(process.pid, "SIGTERM")
        process.exit()
    }, Math.random() * 5000 + 5000)
}
