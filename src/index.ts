const createWorkerTemplate = (
  funcString: string,
) => `self.onmessage = async (e) => {
  const execFunc = ${funcString}
 
  const result = await execFunc(...e.data);
  postMessage(result);
};
`;

type WorkerFunction = (...args: unknown[]) => unknown;

export const createWorker = (fn: WorkerFunction) => {
  const toString = fn.toString();
  const workerTemplate = createWorkerTemplate(toString);

  const blob = new Blob([workerTemplate], { type: 'text/javascript' });
  const blobURL = URL.createObjectURL(blob);
  const myWorker = new Worker(blobURL);

  const returnFunction = async (...args: unknown[]) => {
    myWorker.postMessage([...args]);
    return new Promise((resolve, reject) => {
      myWorker.onmessage = (e) => {
        resolve(e.data);
      };
    });
  };

  return returnFunction;
};
