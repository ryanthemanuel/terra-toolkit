'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _compare = require('wdio-visual-regression-service/compare');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var testIdRegex = /^\[([^)]+)\]/;

function testName(parent, title) {
  var matches = testIdRegex.exec(title);
  var parentName = parent.replace(/[\s+.]/g, '_');
  var name = title.trim().replace(/[\s+.]/g, '_');
  if (matches) {
    name = matches[1];
  }

  return parentName + '[' + name + ']';
}

function getScreenshotName(ref) {
  return function (context) {
    var browserName = context.desiredCapabilities.browserName;
    var browserWidth = context.meta.viewport.width;
    var browserHeight = context.meta.viewport.height;
    var testPath = _path2.default.dirname(context.test.file);
    var name = testName(context.test.parent, context.test.title);
    return _path2.default.join(testPath, '__snapshots__', ref, browserName, name + '.' + browserWidth + 'x' + browserHeight + '.png');
  };
}

module.exports = {
  compare: new _compare.LocalCompare({
    referenceName: getScreenshotName('reference'),
    screenshotName: getScreenshotName('screen'),
    diffName: getScreenshotName('diff'),
    misMatchTolerance: 0.01
  }),
  viewportChangePause: 100,
  widths: []
};