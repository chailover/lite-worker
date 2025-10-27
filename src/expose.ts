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
    const data = e.data;
    if (!data || typeof data.id !== 'number') {
      return self.postMessage({ ok: false, error: { name: 'Error', message: 'Worker error' } });
    }
    const { id, args } = data;
    try {
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
}