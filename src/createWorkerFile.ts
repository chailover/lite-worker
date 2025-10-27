import { type WorkerMessage } from './types';

export const createWorkerFromFile = (generateWorker: () => Worker) => {
  if (!globalThis.Worker) {
    throw new Error('Web Worker is not supported');
  }
  const myWorker = generateWorker();

  const promisesMap = new Map<number, any>();
  let isTerminated = false;
  let id = 1;

  const handleMessage = (e: MessageEvent) => {
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

  const handleError = (e: ErrorEvent | any) => {
    const err = e.error ? e.error : new Error(e.message || 'Worker error');
    promisesMap.forEach((promise) => promise.reject(err));
    promisesMap.clear();
  };

  myWorker.addEventListener('message', handleMessage);
  myWorker.addEventListener('error', handleError);

  const execute = (...args: any): Promise<any> => {
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
  };

  return { execute, terminate };
};
