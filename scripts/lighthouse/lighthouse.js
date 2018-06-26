/* eslint-disable no-console */
const serve = require('../serve/serve-static');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

let server;
let chrome;
let superResults;

const onBuildFinished = (lighthouseOptions) => {
  console.log('Launching headless chrome');
  return chromeLauncher.launch({ chromeFlags: ['--headless'] }).then((chromeArg) => {
    chrome = chromeArg;
    const port = chrome.port;
    // Need to give lighthouse chrome's debugging port
    const lighthouseArgs = { ...lighthouseOptions, port };
    console.log('Starting lighthouse');
    let results = [];
    lighthouseOptions.pages.forEach((page) => {
      lighthouse(page, lighthouseArgs, null).then((lighthouseResult) => {
        results = results.push({ page, result: lighthouseResult });
      });
    });
    console.log('lighthouse done');
    chrome.kill();
    server.close();
    superResults = results;
  });
};

const lighthouseTest = (options, lighthouseOptions, finishedCallback) => {
  const args = {
    ...options,
    callback: onBuildFinished.bind(this, lighthouseOptions),
  };
  server = serve(args).then((serverArg) => {
    server = serverArg;
    server.on('close', () => {
      finishedCallback(superResults);
    });
  }, () => {
    // Kill chrome if webpack gets an error
    if (chrome) {
      chrome.kill();
    }
  });
};

module.exports = lighthouseTest;
