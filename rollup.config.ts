import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RollupOptions } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { visualizer } from 'rollup-plugin-visualizer';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: RollupOptions = {
  input: './src/github-action/prerender-github-action.ts',
  output: {
    dir: 'dist/prerender-github-action/',
    entryFileNames: 'index.js',
    format: 'cjs',
    compact: true,
  },
  plugins: [
    alias({
      /**
       * We alias those to empty modules because we know we are not going to use them
       * in the GitHub action script, and we want the fastest smallest script possible
       */
      entries: [
        {
          find: /yargs\/(.+)/,
          replacement: path.join(
            __dirname,
            './src/github-action/mocks/yargs/$1.js'
          ),
        },
        {
          find: /yargs$/,
          replacement: path.join(__dirname, './src/github-action/mocks/undici'),
        },
        {
          find: 'proxy-agent',
          replacement: path.join(
            __dirname,
            './src/github-action/mocks/proxy-agent'
          ),
        },
        {
          find: 'undici',
          replacement: path.join(__dirname, './src/github-action/mocks/undici'),
        },
      ],
    }),
    nodeResolve({ extensions: ['.ts', '.js'], preferBuiltins: true }),
    commonjs(), // ton of dependencies are still commonjs
    json(), // dependencies require it
    Boolean(process.env['ANALYZE_BUILD']) &&
      visualizer({
        open: true,
        projectRoot: __dirname,
      }),
    typescript({
      tsconfig: 'tsconfig.build.json',
    }),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
};

export default config;
