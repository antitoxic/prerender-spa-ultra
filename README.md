![prerender-spa-ultra: Generate static site from any application, whatever the tech stack. Get the benefits of Jamstack without binding yourself to specific framework or
static generator generator](./docs/header.png)



<div align="center">

Converts your `JavaScript`-powered
[SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA 'Single Page Application')
web application into individual `*.html` documents (_one for each unique `URL`
your app has_) filled with the content that your `JavaScript` generated for
them.


[Usage](#prerender-spa-ultra-usage) — [Goals](#prerender-spa-ultra-goals) —
[Limitations & Caveats](#prerender-spa-ultra-limitations)



(available as _github `action`, `cli` command & `npm` package_)

[![Open `prerender-spa-ultra` in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/antitoxic/prerender-spa-utlra)

</div>

---

### What is this for? (_purpose_)

1. When your app uses `/deep/link/to/a/page` and you want to get a nice preview
   of that page when its `URL` is shared.

   Link sharing over most channels like messaging apps, social networks or other
   websites will not run `JavaScript`, so they will preview your `URL` based on
   your static `*.html` (_which is likely empty_). So if you want to preview
   meaningful things that are shown with `JavaScript` like the the page main
   image, or the correct page title you want to `prerender`.

2. When you expect slow connection to your
   [SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA 'Single Page Application')
   or huge size of your `JavaScript`. Instead of making your users wait staring
   at a blank page you can `prerender` that page, so that the html that gets
   loaded includes the corresponding content and only make the users wait for
   `JavaScript` in order to interact with it

<a name="prerender-spa-ultra-usage"></a>

## Usage

1. As a `github action`
   ([_» see all github action settings_](#prerender-spa-ultra-github-action)):
   ```yaml
   uses: antitoxic/prerender-spa-ultra@v1
   with:
     website_root: 'path/to/your/spa/dist'
   ```
2. As `CLI` ([_» see all cli arguments_](#prerender-spa-ultra-cli)):

   ```shell
   # will automatically start http server
   npx prerender-spa-ultra <path/to/your/output/dir>
   ```

   You can prevent the http server from running or customize further
   [via cli args](#prerender-spa-ultra-cli).

3. As a `npm` package ([_» see full config_](#prerender-spa-ultra-npm-package)):
   > _In contrast to the other approaches, when using `prerender-spa-ultra`
   > programmatically you are responsible for starting the http server for your
   > static files. [» See examples](#http-server-with-fallback) how you can do
   > this._
   ```typescript
   import { preRenderSite } from 'prerender-spa-ultra';
   //...
   await preRenderSite({
     outputDir: 'path/to/output',
     // This is the url at which you started the static http server
     startingUrl: 'http://localhost:8000',
   });
   ```

<a name="prerender-spa-ultra-github-action"></a>

### `github action` usage

Example job definition for prerendering your repository via a github action:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          cache: npm
      - name: Install
        run: |
          npm install
      - name: Build
        run: |
          npm run build
      - name: Prereder the freshly built app
        uses: @antitoxic/prerender-spa-ultra@1
        id: prerender
        with:
          website_root: 'path/to/your/app/dist'
          max_concurrent_pages: 10
```

<a name="prerender-spa-ultra-cli"></a>

### `CLI` usage

Check the help output of `npx prerender-spa-ultra` or the self-explanatory
source code of the cli:
https://github.com/antitoxic/prerender-spa-ultra/blob/a6da7f84504362c34651f23be30cc43a8bb2d3d5/src/prerenderer/cli.ts#L9-L76

<a name="prerender-spa-ultra-npm-package"></a>

### `npm` package usage

`preRenderSite(...)` config type definitions:
https://github.com/antitoxic/prerender-spa-ultra/blob/9792acbd6125124292158192036ca064de5c4be8/src/prerenderer/prerender.ts#L49-L62

If you are not using the peer dependency `node-static` to
[run http server for your static files](#http-server-with-fallback) you can skip

## Debugging problems

You can enable logging:

```shell
PRERENDER_SPA_ULTRA_DEBUG=1 npx prerender-spa-ultra ....
# or
PRERENDER_SPA_ULTRA_DEBUG=1 <your command that uses this package programatically>
```

<a name="http-server-with-fallback"></a>

## Serving your [SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA 'Single Page Application') static files with local http server

The `prerender-spa-ultra`'s cli & github action internally use the
`serve-handler` npm package to start an http server but there are multiple
alternatives:

```shell
cd <path/to/static/files/root/dir/>
# and then one of:
npx serve --single
npx node-static --spa
npx http-server --proxy "http://localhost:8080?"
```

If you are trying to minimize dependencies and don't want to use those, you can
rely on the included `http-server.py` (_python 3_):

```shell
cd <path/to/static/files/root/dir/>
python <path/to/node_modules>/prerender-spa-ultra/src/http-server.py
```

<a name="prerender-spa-ultra-limitations"></a>

## Limitations & Caveats

1. This library shares 2 limitations that any other pre-rendering lib has:
   1. It doesn't work with hash-based routing of SPAs (i.e.
      `example.com/#route`). This is because the server never sees the `#...`
      part of the url, so it can't find a file based on it. If you are in this
      scenario you can try migrating to html5 push history.
   2. Your assets (_media files, `*.js`, `*.css`_) should not be linked as
      relative paths since pre-rendering creates a nested folder structure to
      match the urls you have. Instead, those should be linked from your URL
      root (`/...`).
2. The library will ignore query params and consider all urls having matching
   `pathname` to be one and the same url. You can override this by providing a
   custom `cleanUrl` and `getFilename` functions to `preRenderSite`. It will be
   up to you to configure your http server to route such urls with query params
   to their respective static file (created by `getFilename`).
3. The default `cleanUrl` trims any slashes, which means `some/url/path/` and
   `some/url/path` will be considered the same

<a name="prerender-spa-ultra-goals"></a>

## Goals of `prerender-spa-ultra`

- **Simplest prerender out there**
  - Single programmatic dependency (`puppeteer-core`), nothing else. This also
    means saving build-time otherwise spend downloading packages & binaries on
    every build
  - Pre-renderer with the lowest bug surface (including dependencies) - written
    in the most concise way possible while keeping readability-first design
  - Know what you are executing — One of the goals for `prerender-spa-ultra` is
    to be easy to understand from just reading the code.
  - Uses already available packages & binaries on the OS it's running on (_see
    [Built with CI/CD & JAMSTACK in mind](#serverless)_)
- **Crawls your site**. It will find all you URLs that need prerendering as long
  as they are linked from another page. You don't need to provide explicit list
  of urls to prerender, just pass the URL you want to start with.
- **Optimized for speed of pre-rendering**
  - Stops crawling as soon as possible
  - Blocks unnecessary for the pre-rendering resources from loading (_blocking
    is configurable_). By default, it blocks the following:
    - fonts
    - images & media
    - some known third party scripts (_your site shouldn't fail without them_)
  - Concurrent crawling & concurrent pre-rendering (_concurrency is
    configurable_)
    - Creates a pool of browser pages for pre-rendering in parallel
    - Reuses the pages instead of destroying and recreating them
  - All IO operations are async, no filesystem or network calls that are
    blocking
- <a name="serverless"></a>**Built with CI/CD & JAMSTACK in mind**
  - Provides configurations for Github Action & Cloudflare pages deployment
  - Targets and uses already available packages on those build images

## Non-goals of `prerender-spa-ultra`

`prerender-spa-ultra` has a narrow goal. Let's keep expectation clear:

- `prerender-spa-ultra` is not going to **optimize the output html files**. It's
  far more efficient to do that beforehand in your main SPA assets-build step.
- `prerender-spa-ultra` is not going to **prerender any site you provide**. This
  is specifically made to work together with the local http static file server
  included in it. The purpose of this is making sure you get the maximum
  performance + taking care of some edge case scenarios in headless chrome
- `prerender-spa-ultra` is not going to **provide 100% of the options as CLI
  arguments**. Only the basic customizations are possible by passing CLI
  arguments. If you want to do something more advanced, import
  `prerender-spa-ultra` as a nodejs module and call it with all the options you
  need.
- `prerender-spa-ultra` is not going to **install chrome or chromium**. If you
  are using github workflows or similar, it's likely to have it already
  installed. Otherwise, you can use the OS package manager to install or use
  `node-chromium` (`npm install chromium`)

## Prior art

- https://github.com/egoist/presite
- https://github.com/stereobooster/react-snap
- https://github.com/dattran92/site-prerender
- https://github.com/JoshTheDerf/prerenderer
- https://github.com/sPavl0v/react-spa-prenderer
- https://github.com/chrisvfritz/prerender-spa-plugin

## External Pre-render Services available

- https://webprerender.io/pricing/
- https://prerender.io/

## Marketing locations

- https://github.com/automata/awesome-jamstack
- (old) https://www.tnd.dev/tool/

# Background & References

- Not ideal to use JSDOM since it can't safely execute `<script/>`s
- Good jam-stack intro video: https://vimeo.com/163522126 and the rest:
  https://jamstack.org/resources/videos/
- Available binary packages in various CI/CD pre-build images:
  - https://github.com/cloudflare/pages-build-image/discussions/1 &
    https://developers.cloudflare.com/pages/platform/build-configuration/
  - https://github.com/actions/runner-images/blob/main/images/linux/Ubuntu2204-Readme.md
  - https://github.com/netlify/build-image/blob/focal/included_software.md
- Reserved tlds for local work https://news.ycombinator.com/item?id=12578908
- Github actions running locally:
  - https://stackoverflow.com/questions/59241249/how-to-run-prerender-spa-ultra-github-actions-workflows-locally
  - https://github.com/nektos/act

## Cloudflare integration

https://developers.cloudflare.com/workers/wrangler/ci-cd/

To use cloudflare cli (`wrangler`) from CI like github actions you need to
create `CLOUDFLARE_API_TOKEN` and add it as a secret in that CI environment

Maybe you will need to set `CLOUDFLARE_ACCOUNT_ID` if you have more than 1
accounts associated with this API token.

Must expose github secret as ENV variable (not done by default)
