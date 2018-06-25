/* global browser, describe, it, expect, before, Terra */
describe('comparing screenshots', () => {
  const viewports = Terra.viewports('tiny', 'huge');

  before(() => {
    // Flush old performance logs
    browser.log('performance');
    browser.url('/compare.html');
    const perfLogs = browser.log('performance');
    console.log(perfLogs);
    console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
  });

  it('[0] checks visual comparison with shortened id', () => {
    const screenshots = browser.checkElement('button', { viewports });
    expect(screenshots).to.matchReference();
  });

  it('checks visual comparison with a [tag]', () => {
    const screenshots = browser.checkElement('button', { viewports });
    expect(screenshots).to.matchReference();
  });

  it('checks visual comparison on document level', () => {
    const screenshots = browser.checkViewport({ viewports });
    expect(screenshots).to.matchReference();
  });
});
