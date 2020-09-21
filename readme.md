# Throng

[![npm package](https://img.shields.io/npm/v/throng.svg?style=flat-square)](https://www.npmjs.org/package/throng)
[![Dependency Status](https://david-dm.org/hunterloftis/throng.svg?style=flat-square)](https://david-dm.org/hunterloftis/throng)
[![devDependency Status](https://david-dm.org/hunterloftis/throng/dev-status.svg?style=flat-square)](https://david-dm.org/hunterloftis/throng#info=devDependencies)
[![Build Status](https://travis-ci.org/hunterloftis/throng.svg?branch=master)](https://travis-ci.org/hunterloftis/throng)

Dead-simple one-liner for clustered Node.js apps.

Forks N workers and creates new ones if they go down.
Correctly handles signals from the OS.

```js
const throng = require('throng')

throng(id => console.log(`Started worker ${id}`))
```

```
$ node examples/basic
Started worker 1
Started worker 2
Started worker 3
Started worker 4
```

## Installation

```
$ npm install --save throng
```

## Use

### Fork 1 worker per CPU:

```js
throng(workerStartFunction)
```

### Specify the number of workers:

```js
throng({ worker: workerStartFunction, count: 3 })
```

### More options:

```js
throng({
  master: masterStartFunction,
  worker: workerStartFunction,
  count: 16,
  grace: 1000
})
```

### Handling signals:

(for cleaning up before disconnecting a worker on a SIGTERM, for instance)

```js
throng({ worker })

function worker(id, disconnect) {
  console.log(`Started worker ${id}`)

  process.on('SIGTERM', () => {
    console.log(`Worker ${id} exiting (cleanup here)`)
    disconnect()
  })
})
```

## All options (with defaults)

```js
throng({
  master: () => {},               // Fn to call in master process (can be async)
  worker: yourWorkerFunc,         // Fn to call in cluster workers (can be async)
  count: os.cpus().length,        // Number of workers
  lifetime: Infinity,             // Min time to keep cluster alive (ms)
  grace: 5000,                    // Grace period between signal and hard shutdown (ms)
  signals: ['SIGTERM', 'SIGINT']  // Signals that trigger a shutdown (proxied to workers)
})
```

## A complex example

```js
const throng = require('throng')

throng({ master, worker, count: 4 })

// This will only be called once
function master() {
  console.log('Started master')

  process.on('beforeExit', () => {
    console.log('Master cleanup.')
  })
}

// This will be called four times
function worker(id, disconnect) {
  let exited = false

  console.log(`Started worker ${ id }`)
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  async function shutdown() {
    if (exited) return
    exited = true

    await new Promise(r => setTimeout(r, 300))  // simulate async cleanup work
    console.log(`Worker ${ id } cleanup done.`)
    disconnect()
  }
}
```

```
$ node examples/complex
Started master
Started worker 1
Started worker 3
Started worker 2
Started worker 4
^C
Worker 1 cleanup done.
Worker 3 cleanup done.
Worker 2 cleanup done.
Worker 4 cleanup done.
Master cleanup.
```

## Staying alive

Throng forks replacements for workers that crash so your cluster can continue working through failures.

```
$ node examples/crashy
-1--2--3--4--2--1--3--4--crash!--1--3--4--crash!--5--3--4--6--5--3--4--crash!--6--crash!--crash!--7--6--8--9--7--6--8--9--crash!--7--6--9--10--7--6--9--10--crash!--7--9--10--11--7--crash!--9--crash!--7--12--9--13--crash!--12--9--crash!--crash!--crash!--14--crash!--12--15--crash!--14--18--15--19--14--18--15--crash!--19--14--crash!--15--20--14--21--15--20--14--21--15--20--14--21--15--20--14--21--15-
```

## Test

```
$ docker-compose run --rm dev

node@docker:/home/app$ npm test
```
