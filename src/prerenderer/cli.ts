#!/usr/bin/env node
/* eslint-disable no-console */
import * as path from 'node:path';

import { CliParam, NonBooleanParam, setNestedKey } from '../ts-helpers';
import { preRenderSite, PrerenderUltraOptions } from './prerender';

const CLI_PARAM_DEFINITIONS = [
  {
    isBoolean: true,
    cliParamName: '--block-css',
    correspondingProgrammaticOption: 'pageOptions.block.css',
    helpText: 'Blocks *.css',
  },
  {
    isBoolean: false,
    cliParamName: '--canonical-base-url',
    correspondingProgrammaticOption: 'generateSitemapUsingCanonicalBaseUrl',
    exampleValue: 'https://your-app-domain-in-production.com/',
    helpText:
      'Enables sitemap generation and uses the provided url instead of original base',
    cast: (value, paramName) => {
      if (!value.startsWith('http')) {
        console.error(`${paramName} must be an absolute url`);
        process.exit(2);
      }
      return value;
    },
  },
  {
    isBoolean: false,
    cliParamName: '--start-url',
    correspondingProgrammaticOption: 'startingUrl',
    exampleValue: 'http://localhost:8080/',
    helpText:
      'Enables sitemap generation and uses the provided url instead of original base',
    cast: (value, paramName) => {
      if (!value.startsWith('http')) {
        console.error(`${paramName} must be an absolute url`);
        process.exit(2);
      }
      return value;
    },
  },
  {
    isBoolean: true,
    cliParamName: '--meta-prerender-only',
    correspondingProgrammaticOption: 'metaPrerenderOnly',
    helpText:
      'Mainly used if your only goal to prerender is to capture the changes of html metadata for sharing links.' +
      'Saves .html file of every page but only the <head>...</head> portion changed from the original.',
  },
  {
    isBoolean: true,
    cliParamName: '--selector-to-wait-for',
    correspondingProgrammaticOption: 'selectorToWaitFor',
    helpText:
      'When provided the html will be captured only after the provided DOM element selector exists.',
  },
  {
    isBoolean: false,
    cliParamName: '--max-concurrent-pages',
    correspondingProgrammaticOption: 'maxConcurrentPages',
    exampleValue: 10,
    helpText:
      'Controls how many urls should be prerendered in parallel.' +
      'Each prerender creates a chrome page which takes system resources.' +
      'Tune this for your system.',
    cast: value => {
      const valueAsNumber = Number(value);
      if (!isFinite(valueAsNumber)) {
        console.error(`--max-concurrent-pages must be a number`);
        process.exit(2);
      }
      return valueAsNumber;
    },
  },
  {
    isBoolean: true,
    cliParamName: '--no-http-server',
    helpText:
      'Disable the automatic start of a http static file server from the directory',
  },
] as const satisfies Readonly<Array<CliParam>>;

const help = `
	Usage
	  $ npx prerender-spa-ultra <input>

	Options
	  ${CLI_PARAM_DEFINITIONS.map(
      paramDefinition =>
        `${paramDefinition.cliParamName} ${[
          ...paramDefinition.helpText.split('\n'),
          'correspondingProgrammaticOption' in paramDefinition
            ? `(programatically via ${paramDefinition.correspondingProgrammaticOption})`
            : '(not available programatically)',
        ]
          .map(helpTextLine => helpTextLine.trim())
          .join('\n	    ')}`
    ).join('\n\n	  ')}

	Examples
	  $ npx prerender-spa-ultra ./project/dist
	  $ npx prerender-spa-ultra ${CLI_PARAM_DEFINITIONS.flatMap(paramDefinition =>
      [
        paramDefinition.cliParamName,
        (paramDefinition as NonBooleanParam).exampleValue,
      ].filter(Boolean)
    ).join(' ')} ./project/dist
`;

const cliParams = process.argv.slice(2);

if (!cliParams.length) {
  console.log(help);
  process.exit(2);
}

let parsedParams: Partial<PrerenderUltraOptions> = {};
let shouldStartHttpServer: boolean = true;
const KNOWN_CLI_PARAM_NAMES = CLI_PARAM_DEFINITIONS.map(
  paramDefinition => paramDefinition.cliParamName
);

CLI_PARAM_DEFINITIONS.forEach(paramDefinition => {
  const cliParamIndex = cliParams.indexOf(paramDefinition.cliParamName);

  if (cliParamIndex === -1) {
    return;
  }

  const nextCliParam = cliParams[cliParamIndex + 1];
  if (
    !paramDefinition.isBoolean &&
    (!nextCliParam ||
      (KNOWN_CLI_PARAM_NAMES as string[]).includes(nextCliParam))
  ) {
    console.error(`${paramDefinition.cliParamName} requires a value`);
    process.exit(2);
  }

  const value = paramDefinition.isBoolean
    ? cliParams.includes(paramDefinition.cliParamName)
    : paramDefinition.cast(String(nextCliParam), paramDefinition.cliParamName);

  if ('correspondingProgrammaticOption' in paramDefinition) {
    parsedParams = setNestedKey(
      parsedParams,
      paramDefinition.correspondingProgrammaticOption,
      value
    );
  } else if (paramDefinition.cliParamName === '--no-http-server') {
    shouldStartHttpServer = !value;
  }

  cliParams.splice(cliParamIndex, paramDefinition.isBoolean ? 1 : 2);
});

if (cliParams.length !== 1) {
  console.log(
    `You need to pass 1 unnamed argument for the path but you've passed ${
      cliParams.length
    }${cliParams.length ? `: ${cliParams.join(' ')}` : ''}
    `
  );
  console.log(help);
  process.exit(2);
}

const finalOptions = {
  startingUrl: 'http://localhost:8080',
  outputDir: path.resolve(process.cwd(), cliParams[0]!),
  ...parsedParams,
};

void (async () => {
  if (shouldStartHttpServer) {
    const { createStaticFileServer } = await import('./http-server.js');
    const server = createStaticFileServer(finalOptions.outputDir);
    process.on('exit', () => {
      server.close();
    });
  }

  await preRenderSite(finalOptions);
})();
