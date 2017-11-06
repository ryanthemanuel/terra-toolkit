'use strict';

var AxeService = require('./services').Axe;
var TerraService = require('./services').Terra;
var visualRegression = require('./visualcompare');
var SeleniumDockerService = require('./services').SeleniumDocker;

exports.config = {
  specs: ['./tests/specs/**/*.js'],

  maxInstances: 10,

  capabilities: [{
    browserName: 'chrome'
  }],

  sync: true,
  logLevel: 'silent',
  coloredLogs: true,
  bail: 0,
  screenshotPath: './errorShots/',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  services: ['visual-regression', AxeService, TerraService, SeleniumDockerService],
  visualRegression: visualRegression,
  framework: 'mocha',

  axe: {
    inject: true
  },

  mochaOpts: {
    ui: 'bdd'
  }
};