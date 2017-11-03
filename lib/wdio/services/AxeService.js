'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global browser, axe */


var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axeCoreSrc = void 0;

/**
* Webdriver.io AxeService
* provides the browser.axe() command.
*/

var AxeService = function () {
  function AxeService() {
    _classCallCheck(this, AxeService);
  }

  _createClass(AxeService, [{
    key: 'before',

    // eslint-disable-next-line class-methods-use-this
    value: function before(config) {
      var axeConfig = _extends({
        inject: true }, config.axe || {});

      browser.addCommand('axe', function (options) {
        // Conditionally inject axe. This allows consumers to inject it themselves
        // in the test examples which would slightly speed up test runs.
        if (axeConfig.inject) {
          if (!axeCoreSrc) {
            axeCoreSrc = _fs2.default.readFileSync(require.resolve('axe-core'), 'utf8');
            axeCoreSrc = axeCoreSrc.replace(/^\/\*.*\*\//, '');
          }
          if (browser.execute('return window.axe === undefined;')) {
            browser.execute(axeCoreSrc);
          }
        }

        var currentViewportSize = browser.getViewportSize();
        var viewports = options.viewports;
        var axeOptions = {
          runOnly: options.runOnly,
          rules: options.rules
        };

        if (viewports.length === 0) {
          viewports.push(currentViewportSize);
        }

        // Get accessibility results for each viewport size
        var results = options.viewports.map(function (viewport) {
          browser.setViewportSize(viewport);
          // eslint-disable-next-line func-names, prefer-arrow-callback
          return browser.executeAsync(function (context, opts, done) {
            // eslint-disable-next-line func-names, prefer-arrow-callback
            axe.run(context || document, opts, function (error, result) {
              done({
                // eslint-disable-next-line object-shorthand
                error: error,
                // eslint-disable-next-line object-shorthand
                result: result
              });
            });
          }, options.context, axeOptions).value;
        });

        // set viewport back
        browser.setViewportSize(currentViewportSize);
        return results;
      });
    }
  }]);

  return AxeService;
}();

exports.default = AxeService;