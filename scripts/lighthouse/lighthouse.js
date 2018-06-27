/* eslint-disable no-console */
const serve = require('../serve/serve-static');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

let server;

// Called when serve-static finishes building and starts serving
const onBuildFinished = (chromeFlags, pages, lighthouseFlags, lighthouseConfig, finishedCallback) => {
  console.log('Launching chrome');
  return chromeLauncher.launch({ chromeFlags }).then(async (chrome) => {
    const port = chrome.port;

    // Need to give lighthouse chrome's debugging port
    const newLighthouseFlags = { ...lighthouseFlags, port };
    console.log('Starting lighthouse');

    const results = [];
    /* eslint-disable no-await-in-loop */
    // We're running performance tests so we should wait for each test to finish before starting the next
    for (let i = 0; i < pages.length; i += 1) {
      try {
        const lighthouseResult = await lighthouse(pages[i], newLighthouseFlags, lighthouseConfig);
        results.push({ page: pages[i], result: lighthouseResult });
      } catch (error) {
        results.push({ page: pages[i], error });
      }
    }
    /* eslint-enable no-await-in-loop */

    console.log(`Lighthouse finished${pages.length > 1 && ' all pages'}`);
    chrome.kill();
    server.close();
    finishedCallback(results);
  }, (error) => {
    if (server) {
      server.close();
    }

    throw error;
  });
};

// If our lighthouse dependency gets updated we need to update the links
/**
 * @param options Options to be passed to static-serve
 * @param chromeFlags Flags to pass to chrome at startup
 * @param pages An array of urls to test with lighthouse
 * @param lighthouseFlags Flags to be passed to lighthouse. See:
 *   https://github.com/GoogleChrome/lighthouse/blob/v2.9.4/typings/externs.d.ts#L9
 * @param lighthouseConfig Config options to be passed to lighthouse. See:
 *   https://github.com/GoogleChrome/lighthouse/blob/v2.9.4/docs/configuration.md
 * @param finishedCallback Callback for when all pages have been tested with lighthouse
 * @return An object with a page property for which page was tested and either a results property or an error property
 */
const lighthouseTest = (options, chromeFlags, pages, lighthouseFlags, lighthouseConfig, finishedCallback) => {
  const args = {
    ...options,
    callback: onBuildFinished.bind(this, chromeFlags, pages, lighthouseFlags, lighthouseConfig, finishedCallback),
  };
  server = serve(args).then((serverArg) => {
    // Allows the server to be closed when lighthouse finishes or chrome errors
    server = serverArg;
  }, (error) => {
    throw error;
  });
};

module.exports = lighthouseTest;
