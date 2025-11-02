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

```ts
import { createWorker } from 'lite-worker';

// Must be self-contained (no external imports or captured variables)
const add = async (a: number, b: number) => a + b;

const worker = createWorker(add);

const result = await worker.execute(1, 2); // 3
console.log(result);

worker.terminate(); // cleanup when you're done
```

**createWorkerFromFile**:

Use createWorkerFromFile when you need a full worker module with imports, shared helpers, or libraries.

`worker.ts`
```ts
import { expose } from 'lite-worker';
import { v4 } from 'uuid'; //external dependency

type Item = { name: string };
type ItemWithId = Item & { id: string };

function addIds(items: Item[]): ItemWithId[] {
  return items.map((item) => ({ ...item, id: v4() }));
}
expose(addIds);
```
`main.ts`
```ts
import { createWorkerFromFile } from 'lite-worker';

type Item = { name: string };
type ItemWithId = Item & { id: string };

const items: Item[] = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }];

const worker = createWorkerFromFile<ItemWithId[]>(
  () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
);

const result = await worker.execute(items);
console.log(result); // [{ name: 'Alpha', id: '...' }, ...]

worker.terminate();
```