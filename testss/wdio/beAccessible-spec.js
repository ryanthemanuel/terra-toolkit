/* global browser, describe, before, Terra */
describe('axe', () => {
  const viewports = Terra.viewports('tiny', 'huge');

  describe('accessible', () => {
    before(() => {
      // Flush old performance logs
      browser.log('performance');
      browser.url('/accessible.html');
      const perfLogs = browser.log('performance');
      console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
      browser.setViewportSize(viewports[0]);
    });

    Terra.should.beAccessible({ viewports });
  });

  describe('inaccessible contrast', () => {
    const ignoredA11y = {
      'color-contrast': { enabled: false },
    };

    before(() => browser.url('/inaccessible-contrast.html'));
    Terra.should.beAccessible({ viewports, rules: ignoredA11y });
  });
});
