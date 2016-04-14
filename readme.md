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

Simplest; automatically fork 1 worker per CPU core:

```js
throng(startFunction);
```

Specify a number of workers:

```js
throng(3, startFunction);
```

Specify more options:

```js
throng({
  workers: 16,
  grace: 1000,
  master: masterFunction,
  start: startFunction
});
```

Handle signals (for cleanup on a kill signal, for instance):

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

## All Options (with defaults)

```js
throng({
  workers: 4,       // Number of workers (cpu count)
  lifetime: 10000,  // ms to keep cluster alive (Infinity)
  grace: 4000       // ms grace period after worker SIGTERM (5000)
}, startFn);
```

## A Complex example

```js
const throng = require('./lib/throng');

throng({
  workers: 4,
  master: startMaster,
  start: startWorker
});

// This will only be called once
function startMaster() {
  console.log(`Started master`);
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
