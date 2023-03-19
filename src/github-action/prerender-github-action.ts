import { spawn } from 'child_process';
import * as path from 'path';

import * as core from '@actions/core';

import { preRenderSite } from '../prerenderer/prerender';
// import { preRenderSite } from '../prerenderer/prerender';

try {
  process.env.PRERENDER_SPA_ULTRA_DEBUG = "1"
  const websiteRoot = core.getInput('website_root');
  const p2 = spawn(`cd ${websiteRoot} && python3 ${path.join(__dirname, '../../src/prerenderer/http-server.py')}`, {
    shell: '/bin/bash',
    stdio: 'inherit',
  });
  setTimeout(() => {
    preRenderSite({
      startingUrl: 'http://localhost:8000',
      outputDir: path.join(process.cwd(), websiteRoot, 'prerender'),
      extraBrowserLaunchOptions: {
        // --user-data-dir=/foo/bar
        // args: ['--no-sandbox', '--disable-setuid-sandbox']
        args: ['--no-sandbox']
      }
    });
  }, 2000);
  console.log(`web root: ${websiteRoot}!`);

  const time = new Date().toTimeString();
  core.setOutput('time', time);
} catch (error) {
  core.setFailed((error as Error).message);
}
