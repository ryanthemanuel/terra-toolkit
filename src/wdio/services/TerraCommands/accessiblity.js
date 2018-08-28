/**
* A mocha-chai convenience test case to assert assesiblity.
* @property {Object} options - The Axe options. Available options are viewports,
* rules, runOnly, and contex. See https://www.axe-core.org/docs/.
*/
const beAccessible = (options) => {
  global.it('is accessible @a11y', () => {
    global.expect(global.browser.axe(options)).to.be.accessible();
  });
};

const methods = {
  beAccessible,
};

export default methods;
