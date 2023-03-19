import puppeteer, { Browser, Page, Viewport } from 'puppeteer-core';

import { ResourceType } from 'puppeteer-core/lib/cjs/puppeteer/common/HTTPRequest';

import { getChromeExecutable } from './get-chrome-executable';
import { isThirdParty } from './known-third-party';

/**
 * Puppeteer will launch chrome with certain args (list them by .defaultArgs())
 */
export const getBrowser = async () =>
  puppeteer.launch({
    executablePath: await getChromeExecutable(),
    waitForInitialPage: false,
  });

export interface PageOptions {
  viewport?: Viewport;
  block?: {
    css?: boolean;
    image?: boolean;
    media?: boolean;
    js?: boolean;
    knownThirdParty?: boolean;
    match?(url: string, resourceType: ResourceType): boolean;
  };
}

export const BlockableType = {
  CSS: 'stylesheet',
  IMG: 'image',
  FONT: 'font',
  MEDIA: 'media',
  SCRIPT: 'script',
} as const satisfies Record<string, ResourceType>;

export const getPage = async (browser: Browser, options?: PageOptions) => {
  const page = await browser.newPage();
  if (options?.viewport) {
    await page.setViewport(options.viewport);
  }
  if (options?.block) {
    await page.setRequestInterception(true);
    const { block } = options;
    page.on('request', interceptedRequest => {
      const url = interceptedRequest.url();
      const resourceType = interceptedRequest.resourceType();
      if (
        resourceType === BlockableType.FONT ||
        (block.css && resourceType === BlockableType.CSS) ||
        (block.image && resourceType === BlockableType.IMG) ||
        (block.media && resourceType === BlockableType.MEDIA) ||
        (block.js && resourceType === BlockableType.SCRIPT) ||
        (block.knownThirdParty && isThirdParty(url)) ||
        (block.match && block.match(url, resourceType))
      ) {
        void interceptedRequest.abort();
      } else {
        void interceptedRequest.continue();
      }
    });
  }
  return page;
};

/**
 * Get all the links
 */
export const getLinks = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .filter(a => (a.href || '').startsWith(window.location.origin))
      .map(a => a.href)
  );

/**
 * Custom waiting mechanism, similar to puppeteer's `networkidle2` but able to
 * provide custom time for which to wait after last request is finished
 */
export const waitNetworkIdle = (page: Page, idleMs = 150) =>
  new Promise(resolve => {
    let timer: NodeJS.Timeout;
    page.on('requestfinished', () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(resolve, idleMs);
    });
  });
