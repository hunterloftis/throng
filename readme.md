# Throng

Dead-simple one-liner for clustered apps.

```js
throng(start, { workers: 3 });

function start(id) {
  console.log(`Started worker ${id}`);

  process.on('SIGTERM', function() {
    console.log(`Worker ${id} exiting`);
    process.exit();
  });
}
```

## Installation

```
npm install --save throng
```

## Use

```js
throng(startFunction, options);
```

## All Options

```js
throng(start, {
  workers: 4,       // Number of workers; defaults to CPU count
  lifetime: 10000,  // ms to keep cluster alive; defaults to Infinity
  grace: 4000       // ms grace period after worker SIGTERM; defaults to 5000
});
```

## Tests

```
npm test
```
