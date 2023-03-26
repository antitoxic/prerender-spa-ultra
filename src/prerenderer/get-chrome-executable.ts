import { platform } from 'os';

import { findFirstExistingPath } from './storage';

const OSX_LOCATIONS = ['Google Chrome', 'Chromium', 'Google Chrome Canary'].map(
  app => `/Applications/${app}.app/Contents/MacOS/${app}`
);

const UNIX_LOCATIONS = [
  'google-chrome-stable',
  'google-chrome',
  'chromium',
  'chromium-browser',
].map(binary => `/usr/bin/${binary}`);

const LINUX_LOCATIONS = ['/snap/bin/chromium'];

const getNodeChromiumPath = () =>
  new Promise<string>(resolve => {
    // Workaround for esbuild, which we use because github requires
    // a single file for the github action with all dependencies inlined
    const requireAlias = require;
    console.log(requireAlias('chromium'));
    resolve((requireAlias('chromium') as { path: string }).path);
  }).catch(() => false);

export const getChromeExecutable = async () => {
  try {
    return await findFirstExistingPath(
      [
        process.env['CHROME_PATH'],
        getNodeChromiumPath(),
        ...(platform() === 'darwin' ? OSX_LOCATIONS : []),
        ...UNIX_LOCATIONS,
        ...(platform() === 'linux' ? LINUX_LOCATIONS : []),
      ].filter(Boolean) as string[]
    );
  } catch (e) {
    throw new Error(
      'Cannot find chrome on your system. If you have it installed please set CHROME_PATH env variable'
    );
  }
};
