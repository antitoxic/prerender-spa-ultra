interface PoolEntry<T> {
  obj: T;
  indexInPool: number;
}

export const connectWithPooledObject = <
  T,
  CReturn,
  CArg extends Parameters<any>
>(
  initObj: () => Promise<T>,
  poolSize: number,
  callback: (obj: T) => (...args: CArg) => Promise<CReturn>
): ReturnType<typeof callback> => {
  const concurrentPool = Array.from({ length: poolSize }).map((_, i) =>
    initObj().then(obj => ({ obj, indexInPool: i }))
  );
  return async (...args) => {
    const availablePoolEntry = await Promise.race(concurrentPool);
    let resolveCallback: (poolEntry: PoolEntry<T>) => void;
    const markPoolEntryAsAvailable = () => resolveCallback(availablePoolEntry);
    concurrentPool[availablePoolEntry.indexInPool] = new Promise(
      resolve => (resolveCallback = resolve)
    );
    const result = await callback(availablePoolEntry.obj)(...args);
    markPoolEntryAsAvailable();
    return result;
  };
};

/**
 * Returns the same `fn` function but with limited number of
 * parallel executions configured by `maxConcurrent`
 *
 * @param fn Any async function
 * @param maxConcurrent Maximum allowed parallel executions of `fn`
 */
export const addRateLimit = <CReturn, CArg extends Parameters<any>>(
  fn: (...args: CArg) => Promise<CReturn>,
  maxConcurrent: number
): typeof fn => {
  const running: Promise<unknown>[] = [];
  let firstAvailableSlot: Promise<unknown> = Promise.resolve();

  return (...args) =>
    new Promise(resolve => {
      firstAvailableSlot = firstAvailableSlot.then(() => {
        const runningEntry = fn(...args).finally(() =>
          running.splice(running.indexOf(runningEntry), 1)
        );
        running.push(runningEntry);
        void runningEntry.then(resolve);
        return running.length < maxConcurrent
          ? Promise.resolve()
          : Promise.race(running);
      });
    });
};
