# lite-worker
> Lightweight, minimalist library for Web Workers. Run heavy or isolated tasks off the main thread with a simple execute/terminate API.

- **Simple approach**: Create a Web Worker from a plain function with `createWorker`, or from a dedicated file with `createWorkerFromFile`.
- **TypeScript-ready**: Works great with both JS and TS. Built-in TypeScript typings for all exports.
- **Promise API**: Call `execute()` and get a Promise back; use `terminate()` for cleanup. Worker errors reject the returned Promise on the main thread.
- **Modern & minimal**: ESM‑only, zero dependencies, tree‑shakeable. Module workers by default. Supports all modern browsers.
- **Bundler-friendly**: Works out of the box with modern bundlers including Vite, Webpack 5+, Rollup, Parcel, esbuild, and Turbopack/Rspack. No extra plugins or loaders

### Install

```sh
npm install --save lite-worker
```

### Docs
Check out the [Docs](https://liteworker.dev) for more examples

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
  () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
);

const result = await worker.execute(items); // [{ name: 'Alpha', id: '...' }, ...]
```