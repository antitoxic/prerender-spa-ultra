const KNOWN_THIRD_PARTY = [
  'wtg-ads',
  'facebook.com',
  'fbcdn.net',
  'googletagmanager',
  'google-analytics.com',
  'connect.facebook.net',
  'chimpstatic.com',
  'googleadservices.com',
  'browser.sentry-cdn.com',
  'googleads.g.doubleclick.net',
  '.gemius.pl',
  '.mylivechat.com',
  'maps.googleapis.com',
  'youtube.com/embed',
];

export const isThirdParty = (url: string) =>
  KNOWN_THIRD_PARTY.some(thirdPart => url.includes(thirdPart));
