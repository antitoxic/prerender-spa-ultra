export const log = (...args: unknown[]) => {
  if (process.env['PRERENDER_SPA_ULTRA_DEBUG']) console.log(...args);
};
