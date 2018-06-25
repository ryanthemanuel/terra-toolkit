/* global browser, describe, it, before, after, expect, Terra */
describe('matchScreenshot', () => {
  const viewports = Terra.viewports('tiny', 'huge');

  before(() => {
    // Flush old performance logs
    browser.log('performance');
    browser.url('/compare.html');
    const perfLogs = browser.log('performance');
    console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
    browser.setViewportSize(viewports[0]);
  });

  describe('matchScreenshot', () => {
    Terra.should.matchScreenshot();
  });

  describe('matchScreenshot-test name', () => {
    Terra.should.matchScreenshot('test-name-only');
  });

  describe('matchScreenshot-options--viewports', () => {
    after(() => browser.setViewportSize(viewports[0]));

    Terra.should.matchScreenshot({ viewports });
  });

  describe('matchScreenshot-options--selector', () => {
    Terra.should.matchScreenshot({ selector: 'button' });
  });

  describe('matchScreenshot-options--misMatchTolerance', () => {
    after(() => {
      browser.refresh();
    });

    // Base screenshots
    Terra.should.matchScreenshot();

    it('adjusts image:', () => {
      browser.execute('document.getElementsByClassName("test")[0].style.color = "blue";');
    });

    Terra.should.matchScreenshot({ misMatchTolerance: 100 });

    // Manually verify failure. Create same screenshots as the base screenshots
    it('default', () => {
      // create default screenshot selector
      const selector = browser.options.terra.selector;

      // create default screenshot options
      const compareOptions = {};
      compareOptions.viewports = [];
      compareOptions.misMatchTolerance = browser.options.visualRegression.compare.misMatchTolerance;
      compareOptions.viewportChangePause = browser.options.visualRegression.viewportChangePause;

      const screenshots = browser.checkElement(selector, compareOptions);
      expect(screenshots).to.not.matchReference();
    });
  });

  describe('matchScreenshot-options--viewportChangePause', () => {
    let startTime;
    before(() => {
      startTime = new Date().getTime();
    });

    Terra.should.matchScreenshot({ viewports, viewportChangePause: 500 });

    it('waited as expected', () => {
      const endTime = new Date().getTime();
      const totalTime = endTime - startTime;
      expect(totalTime).to.be.above(500);
    });
  });

  describe('matchScreenshot-test name & options', () => {
    after(() => browser.setViewportSize(viewports[0]));

    Terra.should.matchScreenshot('button', { selector: 'button', viewports });
  });

  describe('matchScreenshot-invalid options', () => {
    Terra.should.matchScreenshot('test-invalid-options', [viewports.tiny, viewports.huge]);
  });
});

describe('Chrome version', () => {
  before(() => browser.url('chrome://version'));

  Terra.should.matchScreenshot('chrome version', { selector: '#inner', viewports: [{ width: 1500, height: 1500 }] });
});
