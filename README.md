TODO:

- CLI & args
- Github action

1. Start local http server in your output dir using:
   ```shell
    cd <path/to/your/output/dir>
    python <path/to/node_modules>/prerender-spa-ultra/src/http-server.py
   ```
2. use this domain when pre-rendering

# Goals

- **Simplest prerender out there**
  - Single dependency (`puppeteer-core`), nothing else. This also means saving
    build-time otherwise spend downloading packages & binaries on every build
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
    - some known third party scripts (_your site shoulnd't fail without them_)
  - Concurrent crawling & concurrent pre-rendering (_concurrency is
    configurable_)
    - Creates a pool of browser pages for pre-rendering in parallel
    - Reuses the pages instead of destroying and recreating them
  - All IO operations are async, no filesystem or network calls that are
    blocking
- <a name="serverless"></a>**Built with CI/CD & JAMSTACK in mind**
  - Provides configurations for Github Action & Cloudflare pages deployment
  - Targets and uses already available packages on those build images

## Non-goals

`prerender-spa-ultra` has a narrow goal. Let's keep expectation clear.

- `prerender-spa-ultra` is not going to **optimize the output html files**. It's
  far more efficient to do that beforehand in your main SPA assets-build step.
- `prerender-spa-ultra` is not going to **prerender any site you provide**. This
  is specifically made to work together with the local http static file server
  included in it. The purpose of this is making sure you get the maximum
  performance + taking care of some edge case scenarios in headless chrome
- `prerender-spa-ultra` is not going to **provide 100% of the options as CLI
  arguments**. Only the basic customizations are possible by passing CLI
  arguments. If you want to do something more advanced, import & call
  `prerender-spa-ultra` as a nodejs module with all the options you need.
- `prerender-spa-ultra` is not going to **install chrome or chromium**. If you
  are using github workflows or similar, it's likely to have it already
  installed. Otherwise you can use the OS package manager to install or use
  `node-chromium` (`npm install chromium`)

# Prior art

- https://github.com/egoist/presite
- https://github.com/stereobooster/react-snap
- https://github.com/dattran92/site-prerender
- https://github.com/JoshTheDerf/prerenderer
- https://github.com/sPavl0v/react-spa-prenderer
- https://github.com/chrisvfritz/prerender-spa-plugin

# External Pre-render Services available

- https://webprerender.io/pricing/
- https://prerender.io/

# Marketing locations

- https://github.com/automata/awesome-jamstack
- (old) https://www.tnd.dev/tool/

# Limitations & Caveats

1. This library shares a limitation that any pre-rendering intended for use by a
   static file server: it doesn't work with hash-based routing of SPAs (i.e.
   `example.com/#route`). This is because the server never sees the `#...` part
   of the url so it can't find a file based it. If you are in this scenario you
   can try migrating to html5 push history
2. The library will ignore query params and consider all urls having matching
   `pathname` to be one and the same url. You can override this by providing a
   custom `cleanUrl` and `getFilename` functions to `prerenderSite`
3. The default `cleanUrl` trims any slashes, which means `some/url/path/` and
   `some/url/path` will be considered the same

# Background & References

- Cannot use JSDOM since it can't safely execute `<script/>`s
- Good jam-stack intro video: https://vimeo.com/163522126 and the rest:
  https://jamstack.org/resources/videos/
- Available binary packages in various CI/CD pre-build images:
  - https://github.com/cloudflare/pages-build-image/discussions/1 &
    https://developers.cloudflare.com/pages/platform/build-configuration/
  - https://github.com/actions/runner-images/blob/main/images/linux/Ubuntu2204-Readme.md
  - https://github.com/netlify/build-image/blob/focal/included_software.md
- Reserved tlds for local work https://news.ycombinator.com/item?id=12578908
- Github actions running locally:
  - https://stackoverflow.com/questions/59241249/how-to-run-github-actions-workflows-locally
  - https://github.com/nektos/act
