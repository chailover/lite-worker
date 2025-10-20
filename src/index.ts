const createWorkerTemplate = (funcString: string) => `
const toPlainError = (err) => ({
  name: err && err.name ? err.name : 'Error',
  message: err && err.message ? err.message : String(err),
  stack: err && err.stack ? err.stack : undefined
});
self.addEventListener('message', async (e) => {
  try {
    const execFunc = ${funcString};
    const result = await execFunc(...e.data);
    postMessage({ ok: true, value: result });
  } catch (err) {
    postMessage({ ok: false, error: toPlainError(err) });
  }
});
self.addEventListener('unhandledrejection', (e) => {
  e.preventDefault();
  postMessage({ ok: false, error: toPlainError(e.reason) });
});
self.addEventListener('error', (e) => {
  e.preventDefault();
  const err = e.error || { name: 'ErrorEvent', message: e.message };
  postMessage({ ok: false, error: toPlainError(err) });
});
`;

type WorkerFunction = (...args: unknown[]) => unknown;
type WorkerMessage = { ok: boolean; value?: unknown; error?: Error };

export const createWorker = (fn: WorkerFunction) => {
  const toString = fn.toString();
  const workerTemplate = createWorkerTemplate(toString);

  const blob = new Blob([workerTemplate], { type: 'text/javascript' });
  const blobURL = URL.createObjectURL(blob);
  const myWorker = new Worker(blobURL);

  const returnFunction = async (...args: unknown[]) => {
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
      myWorker.onerror = (e) => {
        let err: Error;
        if (e.error) {
          err = e.error;
        } else if (e.message) {
          err = new Error(e.message);
        } else {
          err = new Error('Worker error');
        }
        reject(err);
      };
      myWorker.postMessage([...args]);
    });
  };

  return returnFunction;
};
