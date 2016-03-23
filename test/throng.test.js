'use strict';

var assert = require('chai').assert;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var child = require('child_process');
var path = require('path');

var exitCmd = path.join(__dirname, 'fixtures', 'exit');
var lifetimeCmd = path.join(__dirname, 'fixtures', 'lifetime');
var cpusCmd = path.join(__dirname, 'fixtures', 'cpus');
var gracefulCmd = path.join(__dirname, 'fixtures', 'graceful');
var killCmd = path.join(__dirname, 'fixtures', 'kill');
var infiniteCmd = path.join(__dirname, 'fixtures', 'infinite');

describe('throng()', function() {

  describe('with a start function and 3 workers', function() {

    describe('with lifetime of 0', function() {
      before(function(done) {
        run(exitCmd, this, done);
      });
      it('starts 3 workers that immediately exit', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.equal(starts, 3);
      });
    });

    describe('with lifetime of 500ms', function() {
      before(function(done) {
        run(lifetimeCmd, this, done);
      });
      it('starts 3 workers repeatedly', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.ok(starts > 3);
      });
      it('keeps workers running for at least 500ms', function() {
        assert.ok(this.endTime - this.startTime > 500);
      });
    });

    describe('with no lifetime specified', function() {
      before(function(done) {
        this.timeout(4000);
        var child = run(infiniteCmd, this, done);
        setTimeout(function() { child.kill(); }.bind(this), 2000);
      });
      it('starts 3 workers repeatedly', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.ok(starts > 3);
      });
      it('keeps workers running until killed externally', function() {
        assert.closeTo(this.endTime - this.startTime, 2000, 200);
      });
    });
  });

  describe('with no worker count specified', function() {
    before(function(done) {
      run(cpusCmd, this, done);
    });
    it('starts one worker', function() {
      var starts = this.stdout.match(/worker/g).length;
      assert.equal(starts, 1);
    });
  });

  describe('signal handling', function() {

    describe('with 3 workers that exit gracefully', function() {
      before(function(done) {
        var child = run(gracefulCmd, this, done);
        setTimeout(function() { child.kill() }, 750);
      });
      it('starts 3 workers', function() {
        var starts = this.stdout.match(/worker/g).length;
        assert.equal(starts, 3);
      });
      it('allows the workers to shut down', function() {
        var exits = this.stdout.match(/exiting/g).length;
        assert.equal(exits, 3);
      });
    });

    describe('with 3 workers that fail to exit', function() {
      before(function(done) {
        var child = run(killCmd, this, done);
        setTimeout(function() { child.kill() }, 750);
      });
      it('starts 3 workers', function() {
        var starts = this.stdout.match(/ah ha ha ha/g).length;
        assert.equal(starts, 3);
      });
      it('notifies the workers that they should exit', function() {
        var exits = this.stdout.match(/stayin alive/g).length;
        assert.equal(exits, 3);
      });
      it('kills the workers after 250ms', function() {
        assert.closeTo(this.endTime - this.startTime, 1000, 100);
      });
    });

  });
});

function run(file, context, done) {
  var child = spawn('node', [file]);
  context.stdout = '';
  context.startTime = Date.now();
  child.stdout.on('data', function(data) {
    context.stdout += data.toString();
  });
  child.on('close', function(code) {
    context.endTime = Date.now();
    done();
  });
  return child;
}
