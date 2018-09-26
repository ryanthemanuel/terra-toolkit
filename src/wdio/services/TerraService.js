import chai from 'chai';
import chaiMethods from './TerraCommands/chai-methods';
import accessiblity from './TerraCommands/accessiblity';
import visualRegression from './TerraCommands/visual-regression';
import SERVICE_DEFAULTS from '../../../config/wdio/services.default-config';

const { terraViewports: VIEWPORTS } = SERVICE_DEFAULTS;

/**
* Convenience method for getting viewports by name.
* @param sizes - [String] of viewport sizes.
* @return [Object] of viewport sizes.
*/
const getViewports = (...sizes) => {
  let viewportSizes = Object.keys(VIEWPORTS);
  if (sizes.length) {
    viewportSizes = sizes;
  }
  return viewportSizes.map(size => VIEWPORTS[size]);
};

/**
* Sets the viewport for the test run if the formFactor config is defined.
* @param formFactor - [String] the viewport size.
*/
const setViewport = (formFactor) => {
  if (formFactor) {
    const terraViewport = VIEWPORTS[formFactor];
    if (terraViewport !== undefined && typeof terraViewport === 'object') {
      console.log('SET! ', terraViewport);
      global.browser.setViewportSize(terraViewport);
    } else {
      throw new Error('The formFactor supplied is not a Terra-defined viewport size.');
    }
  }
};

const promiseSetViewport = formFactor => (
  new Promise((resolve) => {
    setViewport(formFactor);
    resolve();
  })
);

const delay = (ms) => {
  console.log('delaying...');
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
* Webdriver.io TerraService
* Provides global access to chia, as well as custom chai assertions.
* Also provides access a global instance of the Terra object which
* provides accessibliy and visual regression test steps.
*/
export default class TerraService {
  // eslint-disable-next-line class-methods-use-this
  async before() {
    if (global.browser.desiredCapabilities.browserName === 'internet explorer') {
      console.log('before delaying...');
      await delay(3000);
      console.log('setting viewport');
      await promiseSetViewport(global.browser.options.formFactor);
      console.log('AFTER setting viewport');
      await delay(3000);
    } else {
      setViewport(global.browser.options.formFactor);
    }

    chai.config.showDiff = false;
    global.expect = chai.expect;
    global.should = chai.should();
    global.Terra = {
      viewports: getViewports,
      should: {
        beAccessible: accessiblity.beAccessible,
        matchScreenshot: visualRegression.matchScreenshotWithinTolerance,
        themeEachCustomProperty: visualRegression.themeEachCustomProperty,
        themeCombinationOfCustomProperties: visualRegression.themeCombinationOfCustomProperties,
      },
    };
    chai.Assertion.addMethod('accessible', chaiMethods.accessible);
    chai.Assertion.addMethod('matchReference', chaiMethods.matchReference);
  }
}
