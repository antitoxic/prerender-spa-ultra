import { createServer } from 'node:http';

import handler from 'serve-handler';

export const createStaticFileServer = (websiteRoot: string) => {
  const staticFileServerConfig = {
    public: websiteRoot,
    rewrites: [
      {
        source: '**',
        destination: '/index.html',
      },
    ],
  };
  return createServer(
    (req, res) => void handler(req, res, staticFileServerConfig)
  ).listen(8080);
};
