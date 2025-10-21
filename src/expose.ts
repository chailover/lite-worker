/* eslint-disable */
export function expose(
  fn: (payload: any) => any
) {
  self.addEventListener('message', async (e: any) => {
    try {
      console.log('expose', e);
      // @ts-ignore
      const result = await fn(...e.data);
      self.postMessage({ ok: true, value: result });
    } catch (err) {
      self.postMessage({ ok: false, error: err });
    }
  });

}