'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _child_process = require('child_process');

var _retry = require('async/retry');

var _retry2 = _interopRequireDefault(_retry);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var getSeleniumStatus = function getSeleniumStatus(hostname, port, url) {
  return function (callback) {
    _http2.default.get({ hostname: hostname, port: port, path: _path2.default.join(url || '/wd/hub', 'status') }, function (res) {
      var statusCode = res.statusCode;

      if (statusCode !== 200) {
        callback('Request failed');
        return;
      }

      res.setEncoding('utf8');
      var rawData = '';
      res.on('data', function (chunk) {
        rawData += chunk;
      });
      res.on('end', function () {
        try {
          var status = JSON.parse(rawData);
          if (status.value && status.value.ready) {
            callback(null, status);
          } else {
            callback(status);
          }
        } catch (e) {
          callback('Request failed: ' + e.message);
        }
      });
    }).on('error', function (e) {
      callback('Request failed: ' + e.message);
    });
  };
};

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
    enormous: { width: 1500, height: 768 }
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

    this.cidfile = '.docker_selenium_id';
  }

  _createClass(TerraService, [{
    key: 'onPrepare',
    value: function onPrepare(config) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (!process.env.TRAVIS) {
          (0, _child_process.exec)('docker run --rm --cidfile ' + _this.cidfile + ' -p ' + config.port + ':4444 selenium/standalone-chrome');
          // Retry for 500 times up to 5 seconds for selenium to start
          (0, _retry2.default)({ times: 500, interval: 10 }, getSeleniumStatus(config.host, config.port, config.path), function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        } else {
          resolve();
        }
      });
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
  }, {
    key: 'onComplete',
    value: function onComplete() {
      if (!process.env.TRAVIS) {
        var containerId = _fs2.default.readFileSync(this.cidfile, 'utf8');
        (0, _child_process.exec)('docker stop ' + containerId + ' standalone-chrome && docker');
        _fs2.default.unlinkSync(this.cidfile);
      }
    }
  }]);

  return TerraService;
}();

exports.default = TerraService;