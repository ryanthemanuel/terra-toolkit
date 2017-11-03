'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* accessible chai assertion to be paired with browser.axe() tess.
*/
function accessible() {
  // eslint-disable-next-line no-underscore-dangle
  new _chai2.default.Assertion(this._obj).to.be.instanceof(Array);
  // eslint-disable-next-line no-underscore-dangle
  var errors = this._obj.filter(function (test) {
    return test.result;
  }).reduce(function (all, test) {
    return all.concat(test.result.violations);
  }, []).filter(function (test) {
    return test;
  }).map(function (test) {
    return '' + JSON.stringify(test, null, 4);
  });

  this.assert(errors.length === 0, 'expected no accessibility violations but got:\n\t' + errors[0], 'expected accessibilty errors but received none');
}

/**
* matchReference chai assertion to be paired with browser.capture()
* visual regression tests.
*/
function matchReference() {
  // eslint-disable-next-line no-underscore-dangle
  new _chai2.default.Assertion(this._obj).to.be.instanceof(Array);
  // eslint-disable-next-line no-underscore-dangle
  this.assert(this._obj.every(function (src) {
    return src.isExactSameImage;
  }), 'expected screenshots to match reference', 'expected screenshots to not match reference');
}

/**
* convenience method for getting viewports by name
* @param sizes - [String] of viewport sizes.
* @return [Object] of viewport sizes.
*/
var viewport = function viewport() {
  for (var _len = arguments.length, sizes = Array(_len), _key = 0; _key < _len; _key++) {
    sizes[_key] = arguments[_key];
  }

  var widths = {
    tiny: { width: 470, height: 768 },
    small: { width: 622, height: 768 },
    medium: { width: 838, height: 768 },
    large: { width: 1000, height: 768 },
    huge: { width: 1300, height: 768 },
    enormous: { width: 1500, height: 768 }
  };

  if (sizes.length === 0) {
    return global.viewport('tiny', 'small', 'medium', 'large', 'huge');
  }

  return sizes.map(function (size) {
    return widths[size];
  });
};

/**
* Webdriver.io AxeService
* provides custom chai assertoins.
*/

var TerraService = function () {
  function TerraService() {
    _classCallCheck(this, TerraService);
  }

  _createClass(TerraService, [{
    key: 'before',

    // eslint-disable-next-line class-methods-use-this
    value: function before() {
      global.expect = _chai2.default.expect;
      global.viewport = viewport;
      _chai2.default.Assertion.addMethod('accessible', accessible);
      _chai2.default.Assertion.addMethod('matchReference', matchReference);
    }
  }]);

  return TerraService;
}();

exports.default = TerraService;