#!/usr/bin/env node
/* eslint-disable no-console */
import { preRenderSite } from './prerender';

enum KnownCliParam {
  CANONICAL_URL = '--canonical-base-url',
  BLOCKCSS = '--block-css',
  META_PRERENDER_ONLY = '--meta-prerender-only',
  MAX_CONCURRENT_PAGES = '--max-concurrent-pages',
}

const help = `
	Usage
	  $ npx prerender-spa-ultra <input>

	Options
	  ${KnownCliParam.BLOCKCSS} Blocks css (programatically 'pageOptions.block.css')
	  ${
      KnownCliParam.CANONICAL_URL
    } Enables sitemap generation and uses the provided url instead of original base (programatically 'sitemapOptions.canonicalBaseUrl')
	  ${
      KnownCliParam.META_PRERENDER_ONLY
    } Mainly used if your only goal to prerender is capture the changes of html metadata for sharing links. 
	    Saves .html file of every page but with only <head>...</head> portion changed from the original.
    ${
      KnownCliParam.MAX_CONCURRENT_PAGES
    } Controls how many urls should be prerendered in parallel. 
      Each prerender creates a chrome page which takes system resources. 
      Tune this for your system.

	Examples
	  $ npx prerender-spa-ultra ./project/dist
	  $ npx prerender-spa-ultra ${Object.values(KnownCliParam).join(
      ' '
    )} ./project/dist
`;

const cliParams = process.argv.slice(2);

if (!cliParams.length) {
  console.log(help);
  process.exit(2);
}

const unknownParams = cliParams.filter(
  p => !Object.values<string>(KnownCliParam).includes(p)
);

if (unknownParams.length !== 1) {
  console.log(
    `You need to pass 1 unnamed argument for the path but you've passed ${
      unknownParams.length
    }${unknownParams.length ? `: ${unknownParams.join(' ')}` : ''}`
  );
  console.log(help);
  process.exit(2);
}

void preRenderSite({
  startingUrl: 'http://localhost:8000',
  outputDir: unknownParams[0],
  metaPrerenderOnly: cliParams.includes(KnownCliParam.META_PRERENDER_ONLY),
  pageOptions: {
    block: {
      css: cliParams.includes(KnownCliParam.BLOCKCSS),
    },
  },
});
