'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global browser, axe */


var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axeCoreSrc = _fs2.default.readFileSync(_path2.default.join('node_modules', 'axe-core', 'axe.min.js'), 'utf8');
axeCoreSrc = axeCoreSrc.replace(/^\/\*.*\*\//, '');

var AxeService = function () {
  function AxeService() {
    _classCallCheck(this, AxeService);
  }

  _createClass(AxeService, [{
    key: 'before',

    // eslint-disable-next-line class-methods-use-this
    value: function before() {
      browser.addCommand('axe', function (options) {
        if (browser.execute('return window.axe === undefined;')) {
          browser.execute(axeCoreSrc);
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