Content in this dir is all just files with empty `{}` exports.

It is used to avoid including huge puppeteer-core dependencies which are never
going to be used for our case — pre-rendering.

This is only relevant for the GitHub action usage since GitHub requires a single
js file (pre-built bundle).
