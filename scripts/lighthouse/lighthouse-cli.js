/* eslint-disable no-console */
const commander = require('commander');
const lighthouseTest = require('./lighthouse');
const loadWebpackConfig = require('../serve/loadWebpackConfig');

const packageJson = require('../../package.json');

// Parse process arguments
commander
  .version(packageJson.version)
  .option('--config <path>', 'The webpack config to use for serve. Alias for <config>.', undefined)
  .option('--port <n>', 'The port the app should listen on', parseInt)
  .option('--disk', 'The webpack assets will be written to disk instead of a virtual file system.')
  .option('--page <s>', 'The page to run the lighthouse test on')
  .option('--perf', 'Lighthouse will only test performance', false)
  .option('--no-mobile-emulation', 'Lighthouse will not emulate a mobile device', false)
  .option('--no-cpu-throttle', 'Lighthouse will not throttle the cpu', true)
  .option('--no-network-throttle', 'Lighthouse will not throttle the network connection', false)
  .option('--save-assets', 'Lighthouse will save traces and screenshots', false)
  .option('--save-artifacts', 'Lighthouse will save all artifacts', false)
  .parse(process.argv);

if (!commander.page) {
  console.error('"--page <s>" is a required argument.');
  process.exit(1);
}

if (!commander.page) {
  console.error('"--config <path>" is a required argument.');
  process.exit(1);
}

const port = commander.port || process.env.PORT;
const configPath = loadWebpackConfig(commander.config);

lighthouseTest({
  config: configPath,
  disk: commander.disk,
  host: 'localhost',
  port,
}, {
  pages: [commander.page],
  perf: commander.perf,
  disableDeviceEmulation: !commander.mobileEmulation,
  disableCPUThrottling: !commander.cpuThrottle,
  disableNetworkThrottling: !commander.networkThrottle,
  saveAssets: commander.saveAssets,
  saveArtifacts: commander.saveArtifacts,
}, (returnedResults) => {
  console.group('\nLighthouse results\n');

  console.group('Categories and  scores');
  returnedResults[0].result.reportCategories.forEach((element) => {
    console.log(`${element.name}: ${element.score}`);
  });
  console.groupEnd('Categories and  scores\n');

  console.log('\n');
  console.log(`First meaningful paint: ${returnedResults[0].result.audits['first-meaningful-paint'].displayValue}`);
  console.log(`First Interactive: ${returnedResults[0].result.audits['first-interactive'].displayValue}`);

  console.groupEnd('Lighthouse results');
});
