import { spawn } from 'child_process';
import * as path from 'path';

import * as core from '@actions/core';
import waitOn from 'wait-on';

import { preRenderSite } from '../prerenderer/prerender';

(async () => {
  try {
    const websiteRoot = core.getInput('website_root');
    const maxConcurrentPages = core.getInput('max_concurrent_pages');
    const httpServerProcess = spawn(
      `cd ${websiteRoot} && python3 ${path.join(
        __dirname,
        // path is such because this is executed from dist/prerender-github-action
        '../../src/http-server.py'
      )}`,
      {
        shell: '/bin/bash',
        stdio: 'inherit',
      }
    );

    await waitOn({
      resources: ['tcp:8000'],
      tcpTimeout: 50,
    });

    const crawled = await preRenderSite({
      startingUrl: 'http://localhost:8000',
      maxConcurrentPages: Number(maxConcurrentPages),
      outputDir: path.join(process.cwd(), websiteRoot),
      extraBrowserLaunchOptions: {
        /**
         * github actions run as root and chrome won't start unless we disable sandboxing
         */
        args: ['--no-sandbox'],
      },
    });

    core.setOutput('crawled', crawled);
    httpServerProcess.kill();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
})();
