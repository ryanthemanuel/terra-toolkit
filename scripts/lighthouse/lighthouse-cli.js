/* eslint-disable no-console */
const commander = require('commander');
const lighthouseTest = require('./lighthouse');
const lighthousePerfConfig = require('lighthouse/lighthouse-core/config/perf-config.js');
const loadWebpackConfig = require('../serve/loadWebpackConfig');

const fs = require('fs');

const packageJson = require('../../package.json');

// Parse process arguments
commander
  .version(packageJson.version)
  .option('--config <path>', 'The webpack config to use for serve', undefined)
  .option('--port <n>', 'The port the app should listen on', parseInt)
  .option('--disk', 'The webpack assets will be written to disk instead of a virtual file system')
  .option('--no-headless', 'Chrome will not run in headless mode', false)
  .option('--chrome-flags <s>', 'Flags to pass to chrome when it is launched (is repeatable)', (flag, flags = []) => {
    flags.push(flag);
    return flags;
  })
  .option('--pages <s>', 'The pages to run the lighthouse test on (is repeatable)', (page, pages = []) => {
    pages.push(page);
    return pages;
  })
  .option('--perf', 'Lighthouse will only test performance', false)
  .option('--save-artifacts', 'Lighthouse will save all artifacts', false)
  .parse(process.argv);

if (!commander.pages) {
  console.error('"--pages <s>" is a required argument.');
  process.exit(1);
}

if (!commander.config) {
  console.error('"--config <path>" is a required argument.');
  process.exit(1);
}

const port = commander.port || process.env.PORT;
const configPath = loadWebpackConfig(commander.config);
const chromeFlags = commander.chromeFlags || [];
if (commander.headless) {
  chromeFlags.push('--headless');
}
const lighthouseConfig = commander.perf ? lighthousePerfConfig : {
  // Extend Lighthouse's default config
  extends: true,
};

lighthouseTest(
  {
    config: configPath,
    disk: commander.disk,
    host: 'localhost',
    port,
    production: true,
  },
  chromeFlags,
  commander.pages,
  {
    gatherMode: commander.saveArtifacts,
    auditMode: commander.saveArtifacts,
  },
  lighthouseConfig,
  (results) => {
    results.forEach((result) => {
      if (result.error) {
        console.error(`Encountered an error while running lighthouse on page "${result.page}": ${String(result.error)}`);
        return;
      }
      console.group(`\nLighthouse results for ${result.page}\n`);

      console.group('Categories and scores');
      Object.keys(result.result.lhr.categories).forEach((key) => {
        console.log(`${result.result.lhr.categories[key].title}: ${result.result.lhr.categories[key].score}`);
      });
      console.groupEnd('Categories and scores');

      console.log(`First Contentful paint: ${result.result.lhr.audits['first-contentful-paint'].rawValue} ms`);
      console.log(`First Interactive: ${result.result.lhr.audits.interactive.rawValue} ms`);

      console.groupEnd(`\nLighthouse results for ${result.page}\n`);
    });
  },
);
