import { WorkerMessage, WorkerFunc,  MappedPromise } from './types';

const createWorkerTemplate = (funcString: string) => `
const toPlainError = (err) => ({
  name: err && err.name ? err.name : 'Error',
  message: err && err.message ? err.message : String(err),
  stack: err && err.stack ? err.stack : undefined
});
self.addEventListener('message', async (e) => {
  const data = e.data;
  if (!data || typeof data.id !== 'number') {
    return self.postMessage({ ok: false, error: { name: 'Error', message: 'Worker error' } });
  }
  const { id, args } = data;
  try {
    const workerFunc = ${funcString};
    const result = await workerFunc(...args);
    return self.postMessage({ id, ok: true, value: result });
  } catch (err) {
    return self.postMessage({ id, ok: false, error: toPlainError(err) });
  }
});
self.addEventListener('unhandledrejection', (e) => {
  e.preventDefault();
  return self.postMessage({ ok: false, error: toPlainError(e.reason) });
});
self.addEventListener('error', (e) => {
  e.preventDefault();
  const err = e.error || { name: 'Error', message: e.message };
  return self.postMessage({ ok: false, error: toPlainError(err) });
});
`;


export const createWorker = <T extends unknown[], K>(
  fn: WorkerFunc<T, K>,
  options?: WorkerOptions,
) => {
  if (!globalThis.Worker) {
    throw new Error('Web Worker is not supported');
  }
  const workerOptions: WorkerOptions = {
    type: 'module',
    ...options,
  };
  const toString = fn.toString();
  const workerTemplate = createWorkerTemplate(toString);
  const blob = new Blob([workerTemplate], { type: 'text/javascript' });
  const blobURL = URL.createObjectURL(blob);
  const myWorker = new Worker(blobURL, workerOptions);

  const promisesMap = new Map<number, MappedPromise>();
  let isTerminated = false;
  let id = 1;

  const handleMessage = (e: MessageEvent<WorkerMessage>) => {
    const data = e.data;
    if (data && typeof data.id === 'number') {
      const currentPromise = promisesMap.get(data.id);
      if (!currentPromise) {
        return;
      }
      promisesMap.delete(data.id);
      if (data.ok) {
        currentPromise.resolve(data.value);
      } else {
        const errObj = data.error;
        const err = new Error(errObj?.message || 'Worker error');
        if (errObj?.name) err.name = errObj.name;
        if (errObj?.stack) err.stack = errObj.stack;
        currentPromise.reject(err);
      }
      return;
    }
    if (data && data.ok === false && data.error) {
      const errObj = data.error;
      const err = new Error(errObj?.message || 'Worker error');
      if (errObj?.name) err.name = errObj.name;
      if (errObj?.stack) err.stack = errObj.stack;
      promisesMap.forEach((promise) => promise.reject(err));
      promisesMap.clear();
    }
  };

  const handleError = (e: ErrorEvent) => {
    const err = e.error ? e.error : new Error(e.message || 'Worker error');
    promisesMap.forEach((promise) => promise.reject(err));
    promisesMap.clear();
  };

  myWorker.addEventListener('message', handleMessage);
  myWorker.addEventListener('error', handleError);

  const execute = <R = Awaited<K>>(
    ...args: T
  ): Promise<R> => {
    if (isTerminated) {
      return Promise.reject(new Error('Worker is terminated'));
    }
    const nextId = id++;
    return new Promise((resolve, reject) => {
      promisesMap.set(nextId, { resolve, reject });
      try {
        myWorker.postMessage({ id: nextId, args });
      } catch (err) {
        promisesMap.delete(nextId);
        reject(err);
      }
    });
  };

  const terminate = () => {
    isTerminated = true;
    myWorker.removeEventListener('message', handleMessage);
    myWorker.removeEventListener('error', handleError);
    promisesMap.forEach((promise) =>
      promise.reject(new Error('Worker was terminated')),
    );
    promisesMap.clear();
    myWorker.terminate();
    URL.revokeObjectURL(blobURL);
  };

  return { execute, terminate };
};
