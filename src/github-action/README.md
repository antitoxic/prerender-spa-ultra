This directory includes the GitHub action part of `prerender-spa-ultra`.

The most specific part is that GitHub requirement for JS actions is to be a
single file, aka no `node_modules` dependencies which means we need to bundle
everything together and commit this to the repository. Unfortunately a bit ugly
but it is what it is.
