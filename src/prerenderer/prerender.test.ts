import { HTTPResponse, Page } from 'puppeteer-core';
import { beforeAll, describe, expect, MockedFunction, test, vi } from 'vitest';

import { getPageInfo } from './prerender';
import * as PuppeteerWrapper from './puppeteer';

const MOCK_PUPPETEER_PAGE = {
  evaluate: vi.fn(),
} as unknown as Page;
const MOCKED_HTML_META = `<title>Sample title</title><meta xmlns="http://www.w3.org/1999/xhtml" property="og:type" content="website" />`;
const MOCKED_HTML = `<html><head>${MOCKED_HTML_META}</head><body>Some body</body></html>`;

class MockedHttpResponse extends HTTPResponse {
  override headers = vi.fn();
  override text = () => Promise.resolve(MOCKED_HTML);
}

const MOCK_RESPONSE = new MockedHttpResponse();
const MOCKED_URL = 'http://localhost:8080';
const MOCKED_LINK_URLS_FOUND = [`${MOCKED_URL}/aboutme`];

vi.mock('./puppeteer', async importOriginal => {
  const mod = await importOriginal<Promise<typeof PuppeteerWrapper>>();
  return {
    ...mod,
    getLinks: vi.fn(),
    goTo: vi.fn(),
  };
});

describe('getPageInfo', () => {
  beforeAll(() => {
    vi.resetAllMocks();
    (
      PuppeteerWrapper.goTo as MockedFunction<typeof PuppeteerWrapper.goTo>
    ).mockImplementation(() =>
      Promise.resolve({
        res: MOCK_RESPONSE,
        waitNetworkIdle: Promise.resolve(),
      })
    );
  });

  test('aborts when we get non-html response', async () => {
    MOCK_RESPONSE.headers.mockImplementation(() => ({}));
    expect(await getPageInfo(MOCK_PUPPETEER_PAGE, MOCKED_URL)).toBe(false);
    expect(PuppeteerWrapper.goTo).toHaveBeenCalled();
  });

  test('parses html response correctly', async () => {
    MOCK_RESPONSE.headers.mockImplementation(() => ({
      'content-type': 'text/html',
    }));
    (
      MOCK_PUPPETEER_PAGE.evaluate as MockedFunction<Page['evaluate']>
    ).mockImplementation(() => Promise.resolve(MOCKED_HTML_META));
    (
      PuppeteerWrapper.getLinks as MockedFunction<
        typeof PuppeteerWrapper.getLinks
      >
    ).mockImplementation(() => Promise.resolve(MOCKED_LINK_URLS_FOUND));
    expect(await getPageInfo(MOCK_PUPPETEER_PAGE, MOCKED_URL)).toEqual({
      htmlSource: MOCKED_HTML,
      renderedHtmlMeta: MOCKED_HTML_META,
      links: MOCKED_LINK_URLS_FOUND,
    });
    expect(PuppeteerWrapper.goTo).toHaveBeenCalled();
  });
});
