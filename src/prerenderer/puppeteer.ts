import puppeteer, {
  Browser,
  Page,
  PuppeteerLaunchOptions,
  ResourceType,
  Viewport,
} from 'puppeteer-core';

import { getChromeExecutable } from './get-chrome-executable';
import { isThirdParty } from './known-third-party';

/**
 * Puppeteer will launch chrome with certain args (list them by .defaultArgs())
 */
export const getBrowser = async (
  extraBrowserLaunchOptions: Partial<PuppeteerLaunchOptions> = {}
) =>
  puppeteer.launch({
    executablePath: await getChromeExecutable(),
    waitForInitialPage: false,
    ...extraBrowserLaunchOptions,
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

/**
 * Crawling multiple pages in parallel means multiple tabs in Chrome
 * However only a single tab can be focused at a time.
 *
 * For any non-focused tab, any logic relying on `document.hidden`
 * and `window.requestAnimationFrame` will never get executed. That's why
 * we need to monkey-patch/fake that each page is visible.
 *
 * ref: https://stackoverflow.com/a/59472715
 */
export const polyfillAlwaysFocusedTab = () => {
  Object.defineProperty(window.document, 'hidden', {
    get: function () {
      return false;
    },
    configurable: true,
  });
  Object.defineProperty(window.document, 'visibilityState', {
    get: function () {
      return 'visible';
    },
    configurable: true,
  });
  window.requestAnimationFrame = callback => setTimeout(callback, 10);
  window.cancelAnimationFrame = id => clearTimeout(id);
};

export const getPage = async (browser: Browser, options?: PageOptions) => {
  const page = await browser.newPage();
  if (options?.viewport) {
    await page.setViewport(options.viewport);
  }
  await page.evaluateOnNewDocument(polyfillAlwaysFocusedTab);
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
 * Helper to visit a page & check if network is idle
 */
export const goTo = async (page: Page, url: string, idleMs = 150) => {
  /**
   * Custom waiting mechanism, similar to puppeteer's `networkidle2` but able to
   * provide custom time for which to wait after last request is finished
   */
  const waitNetworkIdle = new Promise(resolve => {
    let timer: NodeJS.Timeout;
    const handleRequestFinished = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(done, idleMs);
    };
    const done = () => {
      page.off('requestfinished', handleRequestFinished);
      resolve(true);
    };
    page.on('requestfinished', handleRequestFinished);
  });
  const res = await page.goto(url);
  return { res, waitNetworkIdle };
};
