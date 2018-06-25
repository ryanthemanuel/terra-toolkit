/* global browser, describe, beforeEach, Terra */
describe('themeEachCustomProperty', () => {
  beforeEach(() => {
    // Flush old performance logs
    browser.log('performance');
    browser.url('/theme.html');
    const perfLogs = browser.log('performance');
    console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
  });

  Terra.should.themeEachCustomProperty({
    '--color': 'red',
    '--font-size': '50px',
  });

  Terra.should.themeEachCustomProperty(
    '.test',
    {
      '--color': 'red',
      '--font-size': '50px',
    },
  );
});


/* global browser, describe, beforeEach, Terra */
describe('themeCombinationOfCustomProperties', () => {
  beforeEach(() => {
    // Flush old performance logs
    browser.log('performance');
    browser.url('/theme.html');
    const perfLogs = browser.log('performance');
    console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
  });

  Terra.should.themeCombinationOfCustomProperties({
    testName: 'themed',
    properties: {
      '--color': 'blue',
      '--font-size': '50px',
    },
  });

  Terra.should.themeCombinationOfCustomProperties({
    testName: 'custom',
    selector: '.test',
    properties: {
      '--color': 'green',
      '--font-size': '50px',
    },
  });
});
