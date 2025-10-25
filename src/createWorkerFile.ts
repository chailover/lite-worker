import { type WorkerMessage } from './types';

export const createWorkerFromFile = (generateWorker: () => Worker) => {
  const myWorker = generateWorker();
  let isTerminated = false;

  const execute = async <T>(...args: unknown[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      myWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e?.data && e?.data?.ok) {
          return resolve(e.data.value);
        }
        if (e?.data && e?.data?.error) {
          const { error } = e.data;
          const err = new Error(error?.message || 'Worker error');
          if (error?.name) err.name = error.name;
          if (error?.stack) err.stack = error.stack;
          return reject(err);
        }
        return reject(new Error('Worker error'));
      };
      myWorker.onerror = (e: any) => {
        let err: Error;
        if (e.error) {
          err = e.error;
        } else if (e.message) {
          err = new Error(e.message);
        } else {
          err = new Error('Worker error');
        }
        return reject(err);
      };
      if (isTerminated) {
        return reject(new Error('Worker is terminated'));
      }
      myWorker.postMessage([...args]);
    });
  };

  const terminate = () => {
    isTerminated = true;
    myWorker.onmessage = null;
    myWorker.onerror = null;
    myWorker.terminate();
  };

  return { execute, terminate };
};
