import { Server } from 'node:http';
import * as path from 'node:path';

import * as core from '@actions/core';

import { createStaticFileServer } from '#src/http-server';
import { preRenderSite } from '#src/prerender';

void (async () => {
  let httpServer: Server | null = null;
  try {
    const websiteRoot = core.getInput('website_root');
    const maxConcurrentPages = core.getInput('max_concurrent_pages');
    const metaPrerenderOnly = core.getInput('meta_prerender_only');
    const selectorToWaitFor = core.getInput('selector_to_wait_for');
    const generateSitemapUsingCanonicalBaseUrl =
      core.getInput('canonical_base_url');
    const blockedPartialUrls = core
      .getInput('blocked_partial_urls')
      .trim()
      .split('\n')
      .filter(partialUrl => partialUrl.trim())
      .filter(Boolean);

    const finalWebsiteRoot = path.resolve(process.cwd(), websiteRoot);
    httpServer = createStaticFileServer(finalWebsiteRoot);

    const crawled = await preRenderSite({
      startingUrl: 'http://localhost:8080',
      outputDir: finalWebsiteRoot,
      maxConcurrentPages: Number(maxConcurrentPages),
      metaPrerenderOnly: metaPrerenderOnly === '1',
      ...(selectorToWaitFor && { selectorToWaitFor }),
      ...(generateSitemapUsingCanonicalBaseUrl && {
        generateSitemapUsingCanonicalBaseUrl,
      }),
      ...(blockedPartialUrls.length && {
        pageOptions: {
          block: {
            match: url =>
              blockedPartialUrls.some(partialUrl => url.includes(partialUrl)),
          },
        },
      }),
      extraBrowserLaunchOptions: {
        /**
         * GitHub actions run as root and chrome won't start unless we disable sandboxing
         */
        args: ['--no-sandbox'],
      },
    });

    core.setOutput('crawled', crawled);
  } catch (error) {
    core.setFailed((error as Error).message);
  } finally {
    httpServer?.close();
  }
})();
