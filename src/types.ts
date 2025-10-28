export type WorkerMessage = {
  id: number;
  ok: boolean;
  value?: any;
  error?: Error;
};

export type WorkerFunc<T extends unknown[], K> = (...args: T) => K;

export type MappedPromise = {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};
