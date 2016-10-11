# Throng

Dead-simple one-liner for clustered Node.js apps.

Runs X workers and respawns them if they go down.
Correctly handles signals from the OS.

```js
const throng = require('throng');

throng((id) => {
  console.log(`Started worker ${id}`);
});
```

```
$ node example
Started worker 1
Started worker 2
Started worker 3
Started worker 4
```

## Installation

```
npm install --save throng
```

For older versions of node (< 4.x), use throng 2.x.

## Use

```js
throng(startFunction);
```
Simplest; fork 1 worker per CPU core.

```js
throng(3, startFunction);
```
Specify a number of workers.

```js
throng({
  workers: 16,
  grace: 1000,
  master: masterFunction,
  start: startFunction
});
```
More options.

```js
throng((id) => {
  console.log(`Started worker ${id}`);

  process.on('SIGTERM', function() {
    console.log(`Worker ${id} exiting`);
    console.log('Cleanup here');
    process.exit();
  });
});
```
Handling signals (for cleanup on a kill signal, for instance).

## All Options (with defaults)

```js
throng({
  workers: 4,       // Number of workers (cpu count)
  lifetime: 10000,  // ms to keep cluster alive (Infinity)
  grace: 4000,      // ms grace period after worker SIGTERM (5000)
  master: masterFn, // Function to call when starting the master process
  start: startFn    // Function to call when starting the worker processes
});
```

## A Complex example

```js
const throng = require('throng');

throng({
  workers: 4,
  master: startMaster,
  start: startWorker
});

// This will only be called once
function startMaster() {
  console.log('Started master');

  process.on('beforeExit', () => {
    // `throng.shutdownSignal` will be `undefined` if the cluster exited without
    // being killed e.g. if the workers exited by themselves and `lifetime` is 0.
    console.log(`Master exiting in response to ${throng.shutdownSignal}...`);
    // Making async calls will keep the master alive.
    console.log('(master cleanup would happen here)');
  });
}

// This will be called four times
function startWorker(id) {
  console.log(`Started worker ${ id }`);

  process.on('SIGTERM', () => {
    console.log(`Worker ${ id } exiting...`);
    console.log('(cleanup would happen here)');
    process.exit();
  });
}
```

```
$ node example-complex.js
Started master
Started worker 1
Started worker 2
Started worker 3
Started worker 4

$ killall node

Master exiting in response to SIGTERM...
(master cleanup would happen here)
Worker 3 exiting...
Worker 4 exiting...
(cleanup would happen here)
(cleanup would happen here)
Worker 2 exiting...
(cleanup would happen here)
Worker 1 exiting...
(cleanup would happen here)
```

## Tests

```
npm test
```
