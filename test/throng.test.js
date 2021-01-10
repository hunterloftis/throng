const assert = require('chai').assert
const spawn = require('child_process').spawn
const path = require('path')
const cpuCount = require('os').cpus().length

describe('throng()', function() {

  describe('with no start function', function() {
    before(async function() {
      const [ proc, done ] = run(fixture('throws'))
      const [ out, time ] = await done
      this.out = out
    })
    it('throws an error', function() {
      assert.notEqual(this.out.indexOf('Start function required'), -1)
    })
  })

  describe('with a start function and 3 workers', function() {

    describe('with lifetime of 0', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('exit'))
        const [ out, time ] = await done
        this.out = out
      })
      it('starts 3 workers that immediately exit', function() {
        var starts = this.out.match(/worker/g).length
        assert.equal(starts, 3)
      })
    })

    describe('with lifetime of 500ms', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('lifetime'))
        const [ out, time ] = await done
        this.out = out
        this.time = time
      })
      it('starts 3 workers repeatedly', function() {
        var starts = this.out.match(/worker/g).length
        assert.ok(starts > 3)
      })
      it('keeps workers running for at least 500ms', function() {
        assert.ok(this.time > 500)
      })
    })

    describe('with no lifetime specified', function() {
      before(async function() {
        this.timeout(4000)
        const [ proc, done ] = run(fixture('infinite'))
        setTimeout(() => proc.kill(), 2000)
        const [ out, time ] = await done
        this.out = out
        this.time = time
      })
      it('starts 3 workers repeatedly', function() {
        var starts = this.out.match(/worker/g).length
        assert.ok(starts > 3)
      })
      it('keeps workers running until killed externally', function() {
        assert.closeTo(this.time, 2000, 200)
      })
    })
  })

  describe('with no worker count specified', function() {
    before(async function() {
      const [ proc, done ] = run(fixture('cpus'))
      const [ out, time ] = await done
      this.out = out
    })
    it('starts one worker per CPU', function() {
      var starts = this.out.match(/worker/g).length
      assert.equal(starts, cpuCount)
    })
  })

  if (process.platform === 'win32')
    describe('with schedulingPolicy on Win32', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('platform'))
          const [ out, time ] = await done
          this.out = out
      })
      it('cluster.SCHED_RR', function() {
        var master = this.out.match(/master/g).length
        assert.equal(master, 1)
      })
      
      before(async function() {
        const [ proc, done ] = run(fixture('platform-norr'))
          const [ out, time ] = await done
          this.out = out
      })
      it('cluster.SCHED_NONE', function() {
        var master = this.out.match(/master/g).length
        assert.equal(master, 1)
      })
    })
  else 
  describe('with schedulingPolicy', function() {
    before(async function() {
      const [ proc, done ] = run(fixture('platform'))
        const [ out, time ] = await done
        this.out = out
    })
    it('cluster.SCHED_RR', function() {
      var master = this.out.match(/master/g).length
      assert.equal(master, 1)
    })
    before(async function() {
      const [ proc, done ] = run(fixture('platform-norr'))
        const [ out, time ] = await done
        this.out = out
    })
    it('cluster.SCHED_NONE', function() {
      var master = this.out.match(/master/g).length
      assert.equal(master, 1)
    })
  })

  describe('with a master function and two workers', function() {
    before(async function() {
      const [ proc, done ] = run(fixture('master'))
      const [ out, time ] = await done
      this.out = out
    })
    it('starts one master', function() {
      var master = this.out.match(/master/g).length
      assert.equal(master, 1)
    })
    it('starts two workers', function() {
      var workers = this.out.match(/worker/g).length
      assert.equal(workers, 2)
    })
  })

  describe('signal handling', function() {
    if (process.platform === 'win32') return  // windows does not support signal-based process shutdown

    describe('SIGTERM with 3 workers that exit gracefully', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('graceful'))
        setTimeout(() => proc.kill(), 750)
        const [ out, time ] = await done
        this.out = out
      })
      it('starts 3 workers', function() {
        var starts = this.out.match(/worker/g).length
        assert.equal(starts, 3)
      })
      it('allows the workers to shut down', function() {
        var exits = this.out.match(/exiting/g).length
        assert.equal(exits, 3)
      })
    })

    describe('SIGTERM with 3 workers that fail to exit', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('kill'))
        setTimeout(() => proc.kill(), 1000)
        const [ out, time ] = await done
        this.out = out
        this.time = time
      })
      it('starts 3 workers', function() {
        var starts = this.out.match(/ah ha ha ha/g).length
        assert.equal(starts, 3)
      })
      it('notifies the workers that they should exit', function() {
        var exits = this.out.match(/stayin alive/g).length
        assert.equal(exits, 3)
      })
      it('kills the workers after 250ms', function() {
        assert.closeTo(this.time, 1250, 100)
      })
    })

    describe('SIGINT on the process group (Ctrl+C) with 3 workers that exit gracefully', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('graceful'))
        setTimeout(function() { process.kill(-proc.pid, 'SIGINT') }, 1000)
        const [ out, time ] = await done
        this.out = out
      })
      it('starts 3 workers', function() {
        var starts = this.out.match(/worker/g).length
        assert.equal(starts, 3, this.out)
      })
      it('allows the workers to shut down', function() {
        var exits = this.out.match(/exiting/g).length
        assert.equal(exits, 3, this.out)
      })
    })

    describe('Custom shutdown signal with 3 workers that exit gracefully', function() {
      before(async function() {
        const [ proc, done ] = run(fixture('graceful-sigusr2'))
        setTimeout(() => proc.kill('SIGUSR2'), 750)
        const [ out, time ] = await done
        this.out = out
      })
      it('starts 3 workers', function() {
        var starts = this.out.match(/worker/g).length
        assert.equal(starts, 3)
      })
      it('allows the workers to shut down', function() {
        var exits = this.out.match(/exiting/g).length
        assert.equal(exits, 3)
      })
    })

  })

  describe('Simplified config (worker, count)', () => {
    before(async function() {
      const [ proc, done ] = run(fixture('simple-config'))
      const [ out, time ] = await done
      this.out = out
    })
    it('starts 4 workers', function() {
      const starts = this.out.match(/worker/g).length
      assert.equal(starts, 4)
    })
  })

  describe('Async master and worker functions', () => {
    before(async function() {
      const [ proc, done ] = run(fixture('async'))
      const [ out, time ] = await done
      this.out = out
    })
    it('completes master before starting workers', function() {
      assert.equal(this.out, 'master\nworker\n')
    })
  })
})

function run(file) {
  const child = spawn('node', [file], { detached: true })
  const startTime = Date.now()
  let out = ''

  child.stdout.on('data', data => out += data.toString())
  child.stderr.on('data', data => out += data.toString())
  
  const done = new Promise((resolve, reject) => {
    child.on('close', () => {
      resolve([ out, Date.now() - startTime ])
    })
  })

  return [ child, done ]
}

function fixture(name) {
  return path.join(__dirname, 'fixtures', name)
}
