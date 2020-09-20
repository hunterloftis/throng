const assert = require('chai').assert
const spawn = require('child_process').spawn
const path = require('path')
const cpuCount = require('os').cpus().length

describe('throng()', function() {

  describe('with no start function', function() {
    before(function(done) {
      run(fixture('throws'), this, done)
    })
    it('throws an error', function() {
      assert.notEqual(this.stdout.indexOf('Start function required'), -1)
    })
  })

  describe('with a start function and 3 workers', function() {

    describe('with lifetime of 0', function() {
      before(function(done) {
        run(fixture('exit'), this, done)
      })
      it('starts 3 workers that immediately exit', function() {
        var starts = this.stdout.match(/worker/g).length
        assert.equal(starts, 3)
      })
    })

    describe('with lifetime of 500ms', function() {
      before(function(done) {
        run(fixture('lifetime'), this, done)
      })
      it('starts 3 workers repeatedly', function() {
        var starts = this.stdout.match(/worker/g).length
        assert.ok(starts > 3)
      })
      it('keeps workers running for at least 500ms', function() {
        assert.ok(this.endTime - this.startTime > 500)
      })
    })

    describe('with no lifetime specified', function() {
      before(function (done) {
        this.timeout(4000)
        var child = run(fixture('infinite'), this, done)
        setTimeout(function() { child.kill() }.bind(this), 2000)
      })
      it('starts 3 workers repeatedly', function() {
        var starts = this.stdout.match(/worker/g).length
        assert.ok(starts > 3)
      })
      it('keeps workers running until killed externally', function() {
        assert.closeTo(this.endTime - this.startTime, 2000, 200)
      })
    })
  })

  describe('with no worker count specified', function() {
    before(function(done) {
      run(fixture('cpus'), this, done)
    })
    it('starts one worker per CPU', function() {
      var starts = this.stdout.match(/worker/g).length
      assert.equal(starts, cpuCount)
    })
  })

  describe('with a master function and two workers', function() {
    before(function(done) {
      run(fixture('master'), this, done)
    })
    it('starts one master', function() {
      var master = this.stdout.match(/master/g).length
      assert.equal(master, 1)
    })
    it('starts two workers', function() {
      var workers = this.stdout.match(/worker/g).length
      assert.equal(workers, 2)
    })
  })

  describe('signal handling', function() {
    if (process.platform === 'win32') return  // windows does not support signal-based process shutdown

    describe('SIGTERM with 3 workers that exit gracefully', function() {
      before(function(done) {
        var child = run(fixture('graceful'), this, done)
        setTimeout(function() { child.kill() }, 750)
      })
      it('starts 3 workers', function() {
        var starts = this.stdout.match(/worker/g).length
        assert.equal(starts, 3)
      })
      it('allows the workers to shut down', function() {
        var exits = this.stdout.match(/exiting/g).length
        assert.equal(exits, 3)
      })
    })

    describe('SIGTERM with 3 workers that fail to exit', function() {
      before(function(done) {
        var child = run(fixture('kill'), this, done)
        setTimeout(function() { child.kill() }, 1000)
      })
      it('starts 3 workers', function() {
        var starts = this.stdout.match(/ah ha ha ha/g).length
        assert.equal(starts, 3)
      })
      it('notifies the workers that they should exit', function() {
        var exits = this.stdout.match(/stayin alive/g).length
        assert.equal(exits, 3)
      })
      it('kills the workers after 250ms', function() {
        assert.closeTo(this.endTime - this.startTime, 1250, 100)
      })
    })

    describe('SIGINT on the process group (Ctrl+C) with 3 workers that exit gracefully', function() {
      before(function(done) {
        var child = run(fixture('graceful'), this, done)
        setTimeout(function() { process.kill(-child.pid, 'SIGINT') }, 1000)
      })
      it('starts 3 workers', function() {
        var starts = this.stdout.match(/worker/g).length
        assert.equal(starts, 3)
      })
      it('allows the workers to shut down', function() {
        var exits = this.stdout.match(/exiting/g).length
        assert.equal(exits, 3)
      })
    })

    describe('Custom shutdown signal with 3 workers that exit gracefully', function() {
      before(function(done) {
        var child = run(fixture('graceful-sigusr2'), this, done)
        setTimeout(function() { child.kill('SIGUSR2') }, 750)
      })
      it('starts 3 workers', function() {
        var starts = this.stdout.match(/worker/g).length
        assert.equal(starts, 3)
      })
      it('allows the workers to shut down', function() {
        var exits = this.stdout.match(/exiting/g).length
        assert.equal(exits, 3)
      })
    })

  })

  describe('Simplified config (worker, count)', () => {
    before(done => {
      const child = run(fixture('simple-config'), this, done)
      setTimeout(() => child.kill(), 750)
    })
    it('starts 4 workers', () => {
      const starts = this.stdout.match(/worker/g).length
      assert.equal(starts, 4)
    })
  })

  describe('Async master and worker functions', () => {
    before(done => {
      run(fixture('async'), this, done)
    })
    it('completes master before starting workers', () => {
      assert.equal(this.stdout, 'master\nworker\n')
    })
  })
})

function run(file, context, done) {
  var child = spawn('node', [file], { detached: true })
  context.stdout = ''
  context.startTime = Date.now()
  child.stdout.on('data', function(data) {
    context.stdout += data.toString()
  })
  child.stderr.on('data', function(data) {
    context.stdout += data.toString()
  })
  child.on('close', function(code) {
    context.endTime = Date.now()
    done()
  })
  return child
}

function fixture(name) {
  return path.join(__dirname, 'fixtures', name)
}
