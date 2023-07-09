import * as path from 'path';

import { Page, PuppeteerLaunchOptions } from 'puppeteer-core';

import { addRateLimit, connectWithPooledObject } from './limit';
import { log } from './logging';
import { getBrowser, getLinks, getPage, goTo, PageOptions } from './puppeteer';
import { getFilename, writeFile } from './storage';

const trimSlashes = (str: string) => str.replace(/^\/+|\/+$/g, '');

const recreateUrl = (url: string) => {
  const urlObj = new URL(url);
  return trimSlashes(`${urlObj.origin}${urlObj.pathname}`);
};

const getMinimumSharableHtml = (originalSource: string, renderedHead: string) =>
  originalSource.replace(/<head[\s\S]*>[\s\S]*<\/head>/, renderedHead);

interface PageInfo {
  htmlSource: string;
  renderedHtmlHead: string;
  links: string[];
}

export const getPageInfo = async (
  page: Page,
  url: string
): Promise<PageInfo | false> => {
  const { res, waitNetworkIdle } = await goTo(page, url);
  const isHtml = res!.headers()['content-type']?.includes('text/html');
  if (!isHtml) {
    return false;
  } else {
    await waitNetworkIdle;
    const [htmlSource, renderedHtmlHead, links] = await Promise.all([
      res!.text(),
      page.evaluate(() => new XMLSerializer().serializeToString(document.head)),
      getLinks(page),
    ]);
    return {
      htmlSource,
      renderedHtmlHead,
      links,
    };
  }
};

export interface PrerenderUltraOptions {
  startingUrl: string;
  baseUrl?: string;
  outputDir: string;
  pageOptions?: PageOptions;
  generateSitemapUsingCanonicalBaseUrl?: string;
  maxConcurrentPages?: number;

  // less used options
  getFilename?: (url: string) => string;
  cleanUrl?: (url: string) => string;
  metaPrerenderOnly?: boolean;
  extraBrowserLaunchOptions?: Partial<PuppeteerLaunchOptions>;
}

const DEFAULT_OPTIONS = {
  maxConcurrentPages: 3,
  extraBrowserLaunchOptions: {},
  pageOptions: {
    viewport: { width: 480, height: 850 },
    block: {
      image: true,
      media: true,
      knownThirdParty: true,
    },
  },
  cleanUrl: recreateUrl,
} as const satisfies Partial<PrerenderUltraOptions>;

/**
 *
 * @param userOptions=DEFAULT_OPTIONS
 */
export const preRenderSite = async (userOptions: PrerenderUltraOptions) => {
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    pageOptions: {
      ...DEFAULT_OPTIONS.pageOptions,
      ...userOptions.pageOptions,
      block: {
        ...DEFAULT_OPTIONS.pageOptions.block,
        ...userOptions.pageOptions?.block,
      },
    },
  };
  const baseUrl = options.baseUrl || options.startingUrl;
  const browser = await getBrowser(options.extraBrowserLaunchOptions);

  const getUrlInfo = addRateLimit(
    connectWithPooledObject(
      () => getPage(browser, options.pageOptions),
      options.maxConcurrentPages,
      page => (url: string) => getPageInfo(page, url)
    ),
    options.maxConcurrentPages
  );

  const { crawled } = await prerenderUrl({
    url: options.startingUrl,
    cleanUrl: options.cleanUrl,
    getUrlInfo,
    getUrlFilePath: url =>
      getFilename(trimSlashes(url), options.outputDir, baseUrl),
  });

  if (options.generateSitemapUsingCanonicalBaseUrl) {
    log(`saving sitemap...`);
    await writeFile(
      path.join(options.outputDir, 'sitemap.txt'),
      [...crawled]
        .map(url =>
          url.replace(
            baseUrl,
            options.generateSitemapUsingCanonicalBaseUrl as string
          )
        )
        .join('\n')
    );
  }
  await browser.close();
  return [...crawled];
};

export interface PrerenderUrlOptions {
  url: string;
  getUrlInfo: (url: string) => Promise<PageInfo | false>;
  getUrlFilePath: (url: string) => string;
  cleanUrl: (url: string) => string;
  stats?: { crawled: Set<string>; visited: Set<string> };
}

const prerenderUrl = async ({
  stats = {
    crawled: new Set(),
    visited: new Set(),
  },
  cleanUrl,
  ...options
}: PrerenderUrlOptions) => {
  log(`\nprerendering ... ${options.url}`);
  const url = cleanUrl(options.url);
  stats.visited.add(url);

  const { protocol } = new URL(options.url);
  if (!['http:', 'https:'].includes(protocol)) {
    log('skipping ... not http');
    return stats;
  }

  log(`requesting ... ${url}`);
  const pageInfo = await options.getUrlInfo(url);

  if (!pageInfo) {
    log(`skipping ... not html`);
    return stats;
  }

  await writeFile(
    options.getUrlFilePath(url),
    getMinimumSharableHtml(pageInfo.htmlSource, pageInfo.renderedHtmlHead)
  );
  log(`found ${pageInfo.links.length} links...`);

  stats.crawled.add(url);
  const pageUrlsCleaned = pageInfo.links.map(linkUrl => cleanUrl(linkUrl));
  await Promise.all(
    pageUrlsCleaned
      .filter(
        (linkUrl, i) =>
          pageUrlsCleaned.indexOf(linkUrl) === i && !stats.visited.has(linkUrl)
      )
      .map(linkUrl =>
        prerenderUrl({ ...options, url: linkUrl, cleanUrl, stats })
      )
  );
  return stats;
};
