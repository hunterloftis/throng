# Throng

Dead-simple one-liner for clustered apps.

```js
throng(start, { workers: 3 });

function start() {
  console.log('Started worker');

  process.on('SIGTERM', function() {
    console.log('Worker exiting');
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

## Options

#### workers

Number of Cluster workers to create.
Defaults to number of CPUs available.

#### lifetime

Minimum time to keep the Cluster alive
(by forking new workers if any die).

In milliseconds; defaults to zero.

(Infinity = stay up forever)

#### grace

Grace period for worker shutdown.
Once each worker is sent SIGTERM, the grace period starts.
Any workers still alive when it ends are killed.

In milliseconds; defaults to 5000.

## Example

This is how you might use throng in a web server:

```js
var throng = require('throng');

throng(start, {
  workers: 4,
  lifetime: Infinity,
  grace: 4000
});
```

## Tests

```
npm test
```

