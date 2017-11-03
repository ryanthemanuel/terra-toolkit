'use strict';

var fs = require('fs');
var path = require('path');
var loadJsonFile = require('load-json-file');
var globSync = require('glob').sync;

var getPackageTestDirectories = function getPackageTestDirectories(lernaJSON) {
  return loadJsonFile.sync(lernaJSON).packages.map(function (globPath) {
    return globSync(globPath).map(function (packagePath) {
      return path.join(packagePath, 'tests', 'nightwatch');
    }).filter(fs.existsSync);
  }).reduce(function (a, b) {
    return a.concat(b);
  }, []);
};

module.exports.getPackageTestDirectories = getPackageTestDirectories;