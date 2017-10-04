
const statics = require('node-static');
const http = require('http');
const portfinder = require('portfinder');
const compareImages = require('resemblejs/compareImages');
const fs = require('fs');
const path = require('path');

const staticServer = http.createServer((request, response) => {
  const fileServer = new statics.Server('.storybook-nightwatch');
  request.addListener('end', () => {
    fileServer.serve(request, response);
  }).resume();
});

module.exports = (kind, collect) => {
  let staticPort;
  let snapshotDirectory;
  const testDefinitions = [];
  const testStory = (subStory, config = {}) => {
    testDefinitions.push({
      name: subStory,
      config,
    });
  };

  const buildNightwatchTest = story => (
    (browser) => {
      const params = `?selectedKind=${kind}&selectedStory=${story}`;
      const fileName = `${kind}-${story}.png`;
      const filePath = path.join(snapshotDirectory, fileName);

      // Expected
      browser
        .url(`http://localhost:${staticPort}/iframe.html${params}`)
        .waitForElementPresent('[data-reactroot]', 5000)
        .screenshot(false, (data) => {
          if (fs.existsSync(filePath)) {
            const image = Buffer.from(data.value, 'base64');
            const original = fs.readFileSync(filePath);
            compareImages(
              image,
              original,
            ).then((compared) => {
              browser.assert.ok(compared.rawMisMatchPercentage === 0,
                `Baseline is ${compared.misMatchPercentage}% different`);
            });
          } else {
            fs.writeFileSync(filePath, data.value, 'base64');
          }
        });
    }
  );

  collect(testStory);
  const testSuite = testDefinitions.reduce((tests, testDef) => {
    const test = { [testDef.name]: buildNightwatchTest(testDef.name, testDef.config) };
    return {
      ...test,
      ...tests,
    };
  }, {});

  const before = (browser, done) => {
    const testDirectory = path.dirname(module.parent.filename);
    snapshotDirectory = path.join(testDirectory, '__snapshots__');
    if (!fs.existsSync(snapshotDirectory)) {
      fs.mkdirSync(snapshotDirectory);
    }

    portfinder.getPortPromise().then((port) => {
      staticPort = port;
      console.log(`starting actual stories for ${kind} on port ${port}`);
      staticServer.listen(staticPort);
      done();
    }).catch(console.error);
  };

  const after = (browser, done) => {
    staticServer.close();
    done();
  };

  return {
    before,
    ...testSuite,
    after,
  };
};
