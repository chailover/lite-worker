export type WorkerMessage = { ok: boolean; value?: any; error?: Error };
export type WorkerFunc<T extends unknown[], K> = (...args: T) => K;
