#!/usr/bin/env node
/* eslint-disable no-console */
import { CliParam, NonBooleanParam, setNestedKey } from '../ts-helpers';
import { preRenderSite, PrerenderUltraOptions } from './prerender';

const CLI_PARAM_DEFINITIONS: Array<CliParam> = [
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
    cast: (value: string) => {
      if (!value.startsWith('http')) {
        console.error(`--canonical-base-url must start with 'http`);
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
      'Mainly used if your only goal to prerender is capture the changes of html metadata for sharing links.' +
      'Saves .html file of every page but only the <head>...</head> portion changed from the original.',
  },
  {
    isBoolean: true,
    cliParamName: '--no-http-server',
    correspondingProgrammaticOption: 'maxConcurrentPages',
    helpText:
      'Assumes the http server is already running and will not start it',
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
    cast: (value: string) => {
      const valueAsNumber = Number(value);
      if (!isFinite(valueAsNumber)) {
        console.error(`--max-concurrent-pages must be a number`);
        process.exit(2);
      }
      return valueAsNumber;
    },
  },
];

const help = `
	Usage
	  $ npx prerender-spa-ultra <input>

	Options
	  ${CLI_PARAM_DEFINITIONS.map(
      paramDefinition =>
        `${paramDefinition.cliParamName} ${[
          ...paramDefinition.helpText.split('\n'),
          `(programatically via ${paramDefinition.correspondingProgrammaticOption})`,
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
    (!nextCliParam || KNOWN_CLI_PARAM_NAMES.includes(nextCliParam))
  ) {
    console.error(`${paramDefinition.cliParamName} requires a value`);
    process.exit(2);
  }

  parsedParams = setNestedKey(
    parsedParams,
    paramDefinition.correspondingProgrammaticOption,
    paramDefinition.isBoolean
      ? cliParams.includes(paramDefinition.cliParamName)
      : paramDefinition.cast(String(nextCliParam))
  );

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

void preRenderSite({
  startingUrl: 'http://localhost:8000',
  outputDir: cliParams[0]!,
  ...parsedParams,
});
