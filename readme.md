# Throng

Dead-simple one-liner for clustered apps.

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

Provide a worker count:

```js
throng(3, startFunction);
```

Specify more options:

```js
throng({ workers: 16, grace: 1000 }, startFunction);
```

Handle signals (for cleanup on a kill signal, for instance):

```js
throng((id) => {
  console.log(`Started worker ${id}`);
});

process.on('SIGTERM', function() {
  console.log(`Worker ${id} exiting`);
  console.log('Cleanup here');
  process.exit();
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

## Tests

```
npm test
```
