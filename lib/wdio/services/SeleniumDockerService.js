'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

/**
* Webdriver.io SeleniuMDockerService
* provides standalone chrome/firefox selenium docker automation.
*/
var SeleniumDockerService = function () {
  function SeleniumDockerService() {
    _classCallCheck(this, SeleniumDockerService);

    this.getSeleniumStatus = this.getSeleniumStatus.bind(this);
  }

  _createClass(SeleniumDockerService, [{
    key: 'getSeleniumStatus',
    value: function getSeleniumStatus(callback) {
      _http2.default.get({
        host: this.host,
        port: this.port,
        path: _path2.default.join(this.path || '/wd/hub', 'status')
      }, function (res) {
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
    }

    /**
     * Start up docker container before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */

  }, {
    key: 'onPrepare',
    value: function onPrepare(config, capabilities) {
      var _this = this;

      this.config = _extends({
        cidfile: '.docker_selenium_id', // The docker container id file
        enabled: true, // True if service enabled, false otherwise
        cleanup: false, // True if docker container should be removed after test
        image: null }, config.seleniumDocker || {});
      this.host = config.host;
      this.port = config.port;
      this.path = config.path;
      this.browserName = capabilities[0].browserName;
      this.cidfile = this.config.cidfile || this.cidfile;

      console.log('Returning Promise');

      return new Promise(function (resolve, reject) {
        console.log('On Prepare Promise ' + _this.config.toString());
        if (_this.config.enabled) {
          var containerId = _this.getContainerId();
          if (!containerId) {
            (0, _child_process.exec)('docker run --rm --cidfile ' + _this.cidfile + ' -p ' + config.port + ':4444 ' + _this.getImage());
          }
          // Retry for 500 times up to 5 seconds for selenium to start
          (0, _retry2.default)({ times: 500, interval: 10 }, _this.getSeleniumStatus, function (err, result) {
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

    /**
     * Get the docker image to use based on configuration and browser capabilities.
     * @return The name of the docker image to use.
     */

  }, {
    key: 'getImage',
    value: function getImage() {
      // Use configured image or infer image from browserName (only firefox and safari supported).
      // TODO: Eventually an entire hub should be stood up which supports all browsers in capabilities config
      return this.config.image || 'selenium/standalone-' + this.browserName;
    }

    /**
    * Get the contianer id from the cidfile.
    * @return The docker container id or null if the file does not exist.
    */

  }, {
    key: 'getContainerId',
    value: function getContainerId() {
      var containerId = void 0;
      if (_fs2.default.existsSync(this.cidfile)) {
        containerId = _fs2.default.readFileSync(this.cidfile, 'utf8');
      }
      return containerId;
    }

    /**
     * Clean up docker container after all workers got shut down and the process is about to exit.
     */

  }, {
    key: 'onComplete',
    value: function onComplete() {
      if (this.config.cleanup) {
        var containerId = this.getContainerId();
        if (containerId) {
          (0, _child_process.exec)('docker stop ' + containerId);
          _fs2.default.unlinkSync(this.cidfile);
        }
      }
    }
  }]);

  return SeleniumDockerService;
}();

exports.default = SeleniumDockerService;