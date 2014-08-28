var assert = require('chai').assert;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require('path');
var cpus = require('os').cpus().length;

var exitCmd = 'node ' + path.join(__dirname, 'fixtures', 'exit');
var keepaliveCmd = 'node ' + path.join(__dirname, 'fixtures', 'keepalive');
var cpusCmd = 'node ' + path.join(__dirname, 'fixtures', 'cpus');
var gracefulCmd = 'node ' + path.join(__dirname, 'fixtures', 'graceful');

function run(cmd, context, done) {
  context.startTime = Date.now();
  exec(cmd, function(err, stdout, stderr) {
    this.stdout = stdout;
    this.endTime = Date.now();
    done();
  }.bind(context));
}

function runSignal(file, context, done) {
  var child = spawn('node', [file]);
  context.stdout = '';
  context.startTime = Date.now();
  child.stdout.on('data', function(data) {
    this.stdout += data.toString();
  }.bind(context));
  child.on('close', function(code) {
    context.endTime = Date.now();
    done();
  });
  setTimeout(function() {
    child.kill();
  }, 250);
}

describe('throng()', function() {

  describe('with a start function and 3 instances', function() {

    describe('without keepalive', function() {
      before(function(done) {
        run(exitCmd, this, done);
      });
      it('should start 3 workers that immediately exit', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.equal(starts, 3);
      });
    });

    describe('with keepalive of 250ms', function() {
      before(function(done) {
        run(keepaliveCmd, this, done);
      });
      it('should start 3 workers repeatedly', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.ok(starts > 3);
      });
      it('should keep workers running for at least 250ms', function() {
        assert.ok(this.endTime - this.startTime > 250);
      });
    });
  });

  describe('with just a start function', function() {
    before(function(done) {
      run(cpusCmd, this, done);
    });
    it('should start workers equal to the number of cpus', function() {
      var starts = this.stdout.match(/worker/g).length;
      assert.equal(starts, cpus);
    });
  });

  describe('signal handling', function() {

    describe('with 3 workers that exit gracefully', function() {
      before(function(done) {
        runSignal(path.join(__dirname, 'fixtures', 'graceful'), this, done);
      });
      it('should start 3 workers', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.equal(starts, 3);
      });
      it('should allow the workers to shut down', function() {
        var exits = this.stdout.match(/exiting/g).length;
        assert.equal(exits, 3);
      });
    });

    describe('with 3 workers that fail to exit', function() {
      before(function(done) {
        runSignal(path.join(__dirname, 'fixtures', 'kill'), this, done);
      });
      it('should start 3 workers', function() {
        var starts = this.stdout.match(/ah ha ha ha/g).length;
        assert.equal(starts, 3);
      });
      it('should notify the workers that they should exit', function() {
        var exits = this.stdout.match(/stayin alive/g).length;
        assert.equal(exits, 3);
      });
      it('should kill the workers after 250ms', function() {
        assert.closeTo(this.endTime - this.startTime, 500, 50);
      });
    });

  });
});
