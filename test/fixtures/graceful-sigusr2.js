const throng = require('../../lib/throng')

throng({
    workers: 3,
    signals: ['SIGUSR2'],
    start: (id, disconnect) => {
        let exited = false
        
        console.log('worker')
        process.on('SIGUSR2', exit)
      
        function exit() {
          if (exited) return
          exited = true
          console.log(`exiting`)
          disconnect()
        }
    }
  });
  