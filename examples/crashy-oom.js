const throng = require('../lib/throng')

throng({ worker, count: 3 })

function worker(id) {
    setInterval(() => process.stdout.write(`-${id}-`), 1000)
    setTimeout(() => { 
        // Trigger OOM...this *can* crash without emitting `disconnect`
        process.stdout.write('-OOMing!-')

        const arrays = [];
        while (true) {
            arrays.push(new Array(100000));    
        }
    }, Math.random() * 5000 + 5000)
}
