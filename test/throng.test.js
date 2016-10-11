'use strict';

const assert = require('chai').assert;
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const child = require('child_process');
const path = require('path');
const cpuCount = require('os').cpus().length;

const throwsCmd = path.join(__dirname, 'fixtures', 'throws');
const exitCmd = path.join(__dirname, 'fixtures', 'exit');
const lifetimeCmd = path.join(__dirname, 'fixtures', 'lifetime');
const cpusCmd = path.join(__dirname, 'fixtures', 'cpus');
const masterCmd = path.join(__dirname, 'fixtures', 'master');
const gracefulCmd = path.join(__dirname, 'fixtures', 'graceful');
const killCmd = path.join(__dirname, 'fixtures', 'kill');
const infiniteCmd = path.join(__dirname, 'fixtures', 'infinite');
const beforeExitCmd = path.join(__dirname, 'fixtures', 'beforeExit');
const beforeExitGracefulCmd = path.join(__dirname, 'fixtures', 'beforeExit-graceful');
const beforeExitKillCmd = path.join(__dirname, 'fixtures', 'beforeExit-kill');

describe('throng()', function() {

  describe('with no start function', function() {
    before(function(done) {
      run(throwsCmd, this, done);
    });
    it('throws an error', function() {
      assert.notEqual(this.stdout.indexOf('Start function required'), -1);
    });
  });

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
      before(function (done) {
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
      assert.equal(starts, cpuCount);
    });
  });

  describe('with a master function and two workers', function() {
    before(function(done) {
      run(masterCmd, this, done);
    });
    it('starts one master', function() {
      var master = this.stdout.match(/master/g).length;
      assert.equal(master, 1);
    });
    it('starts two workers', function() {
      var workers = this.stdout.match(/worker/g).length;
      assert.equal(workers, 2);
    });
  });

  describe('signal handling', function() {

    describe('with 3 workers that exit gracefully', function() {
      before(function(done) {
        var child = run(gracefulCmd, this, done);
        setTimeout(function() { child.kill(); }, 750);
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
        setTimeout(function() { child.kill(); }, 750);
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

  describe('`beforeExit` handler', function() {

    describe('with 3 workers that immediately exit', function() {
      before(function(done) {
        run(beforeExitCmd, this, done);
      });
      it('the `beforeExit` handler is invoked', function() {
        assert.notEqual(this.stdout.indexOf('Master exiting in response to undefined'), -1);
      });
    });

    describe('with 3 workers that exit gracefully', function() {
      before(function(done) {
        var child = run(beforeExitGracefulCmd, this, done);
        setTimeout(function() { child.kill(); }, 750);
      });
      it('the `beforeExit` handler is invoked', function() {
        assert.notEqual(this.stdout.indexOf('Master exiting in response to SIGTERM'), -1);
      });
    });

    describe('with 3 workers that fail to exit', function() {
      before(function(done) {
        var child = run(beforeExitKillCmd, this, done);
        setTimeout(function() { child.kill(); }, 750);
      });
      it('the `beforeExit` handler is invoked', function() {
        assert.notEqual(this.stdout.indexOf('Master exiting in response to SIGTERM'), -1);
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
  child.stderr.on('data', function(data) {
    context.stdout += data.toString();
  });
  child.on('close', function(code) {
    context.endTime = Date.now();
    done();
  });
  return child;
}
