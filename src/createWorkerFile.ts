/* eslint-disable */
type WorkerMessage = { ok: boolean; value?: unknown; error?: Error };

export const createWorkerFromFile = (generateWorker: () => Worker) => {
  const myWorker = generateWorker();
  let isTerminated = false;

  const execute = (...args: unknown[]) =>
    new Promise((resolve, reject) => {
      myWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const data = e?.data;
        if (data?.ok) return resolve(data.value);
        if (data?.error) {
          const err = new Error(data.error?.message || 'Worker error');
          if (data.error?.name) err.name = data.error.name;
          if (data.error?.stack) err.stack = data.error.stack;
          return reject(err);
        }
        return reject(new Error('Worker error'));
      };
      myWorker.onerror = (e: any) => {
        const err =
          e?.error ??
          (e?.message ? new Error(e.message) : new Error('Worker error'));
        reject(err);
      };
      if (isTerminated) return reject(new Error('Worker is terminated'));
      myWorker.postMessage([...args]);
    });

  const terminate = () => {
    isTerminated = true;
    myWorker.onmessage = null;
    myWorker.onerror = null;
    myWorker.terminate();
  };

  return { execute, terminate };
};
