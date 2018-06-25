/* global browser, it, expect, describe, before, Terra */
Terra.viewports('tiny', 'small', 'large').forEach((viewport) => {
  describe('Resize Example', () => {
    before(() => {
      browser.setViewportSize(viewport);
      // Flush old performance logs
      browser.log('performance');
      browser.url('/compare.html');
      const perfLogs = browser.log('performance');
      console.log(`Page load duration: ${perfLogs.value[perfLogs.value.length - 1].timestamp - perfLogs.value[0].timestamp}`);
    });

    Terra.should.beAccessible();
    Terra.should.matchScreenshot();
    it(`resizes ${viewport.name}`, () => {
      const size = browser.getViewportSize();
      expect(size.height).to.equal(viewport.height);
      expect(size.width).to.equal(viewport.width);
    });
  });
});
