import { type WorkerFunc } from './types';

export function expose<T extends unknown[], K>(
  workerFunc: WorkerFunc<T, K>
) {
  const toPlainError = (err: any) => ({
    name: err && err.name ? err.name : 'Error',
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined
  });
  self.addEventListener('message', async (e: MessageEvent) => {
    try {
      const result = await workerFunc(...e.data);
      self.postMessage({ ok: true, value: result });
    } catch (err) {
      self.postMessage({ ok: false, error: toPlainError(err) });
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
}