# lite-worker
> Lightweight, minimal library for Web Workers. Run heavy or isolated tasks off the main thread with a simple execute/terminate API.

- Two approaches: createWorker(function-based) or createWorkerFromFile(file-based)
- Promise API: execute(...args) -> Promise, terminate() for cleanup
- Robust errors & lifecycle: propagates name/message/stack, rejects on worker errors, cleans up listeners
- Modern & minimal: ESM workers, bundler‑friendly (Vite/webpack), zero dependencies

### Install

```sh
npm install --save lite-worker
```

### Usage

**createWorker**:

Use createWorker when you don’t need imports or captured variables.

```js
import { createWorker } from 'lite-worker';

const add = (a, b) => a + b;

const worker = createWorker(add);

const result = await worker.execute(1, 2); // 3
```

**createWorkerFromFile**:

Use createWorkerFromFile when you need a full worker module with imports, shared helpers, or libraries.

`worker.js`
```js
import { expose } from 'lite-worker';
import { v4 } from 'uuid'; //external dependency

const addIds = (items) => {
  return items.map((item) => ({ ...item, id: v4() }));
};
expose(addIds);
```
`main.js`
```js
import { createWorkerFromFile } from 'lite-worker';

const items = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }];

const worker = createWorkerFromFile(
  () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
);

const result = await worker.execute(items); // [{ name: 'Alpha', id: '...' }, ...]
```