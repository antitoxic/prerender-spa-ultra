import * as core from '@actions/core';

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('website_root');
  console.log(`Hello ${nameToGreet}!`);
  const time = new Date().toTimeString();
  core.setOutput('time', time);
} catch (error) {
  core.setFailed((error as Error).message);
}
