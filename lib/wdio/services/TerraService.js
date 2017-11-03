'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

function matchReference() {
  // eslint-disable-next-line no-underscore-dangle
  new _chai2.default.Assertion(this._obj).to.be.instanceof(Array);
  // eslint-disable-next-line no-underscore-dangle
  this.assert(this._obj.every(function (src) {
    return src.isExactSameImage;
  }), 'expected screenshots to match reference', 'expected screenshots to not match reference');
}

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
    enormous: { width: 500, hegiht: 768 }
  };

  if (sizes.length === 0) {
    return global.viewport('tiny', 'small', 'medium', 'large', 'huge');
  }

  return sizes.map(function (size) {
    return widths[size];
  });
};

var TerraService = function () {
  function TerraService() {
    _classCallCheck(this, TerraService);
  }

  _createClass(TerraService, [{
    key: 'onPrepare',

    // eslint-disable-next-line class-methods-use-this, consistent-return
    value: function onPrepare() {
      if (!process.env.TRAVIS) {
        this.containerId = (0, _child_process.exec)('docker run -d -p 4444:4444 selenium/standalone-chrome');
        // Sleep a few seconds to let selenium startup
        return new Promise(function (resolve) {
          setTimeout(resolve, 2000);
        });
      }
    }

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'before',
    value: function before() {
      global.expect = _chai2.default.expect;
      global.viewport = viewport;
      _chai2.default.Assertion.addMethod('accessible', accessible);
      _chai2.default.Assertion.addMethod('matchReference', matchReference);
    }

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'onComplete',
    value: function onComplete() {
      if (!process.env.TRAVIS) {
        (0, _child_process.exec)('docker stop ' + this.containerId + ' standalone-chrome && docker rm standalone-chrome ' + this.containerId);
      }
    }
  }]);

  return TerraService;
}();

exports.default = TerraService;