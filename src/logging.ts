export const log = (...args: unknown[]) => {
  if (process.env.ANTON_DEBUG) console.log(...args);
};
