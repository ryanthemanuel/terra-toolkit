/* global browser, describe, it, before, expect, Terra */
let testLocale;
let browserLocale;

describe('I18n Locale', () => {
  before(() => {
    // Flush old performance logs
    browser.log('performance');
    browser.url('/i18n.html');
    const perfLogs = browser.log('performance');
    console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
    testLocale = browser.options.locale || 'en';
    browserLocale = browser.getAttribute('html', 'lang');
  });

  it('Express correctly sets the application locale', () => {
    browser.setValue('#input-wdio-defined', testLocale);
    browser.setValue('#input-actual', browserLocale);
    expect(testLocale).to.equal(browserLocale);
  });

  Terra.should.matchScreenshot({ selector: '#i18n-validation' });
});
