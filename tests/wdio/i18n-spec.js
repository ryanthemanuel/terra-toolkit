/* global browser, describe, it, before, expect, Terra */
const testPerformance = require('../../src/wdio/services/TerraCommands/performance-util');
const cycle = require('./cycle');
const fs = require('fs');

let testLocale;
let browserLocale;

function dumpScreenshot(filmStripModel) {
  const frames = filmStripModel.frames();
  const framesLen = frames.length;
  if (framesLen >= 1) {
    frames[framesLen - 1].imageDataPromise()
      .then(data => Promise.resolve(`data:image/jpg;base64,${data}`))
      .then((img) => {
        console.log('Filmstrip model last screenshot:\n', `${img.substr(0, 50)}...`);
      });
  }
}

function dumpTree(tree, timeValue) {
  const result = new Map();
  tree.children.forEach((value, key) => result.set(key, value[timeValue].toFixed(1)));
  return result;
}

function report(events, title) {
  // const model = new TraceToTimelineModel(events);
  const model = events;

  if (!console.group) {
    console.group = n => console.log(n, ':');
    console.groupEnd = () => console.log('');
  }
  console.log('\n');
  console.group(title);
  // console.log(`\n${title}\n`);

  console.log('Timeline model events:\n', model.timelineModel().mainThreadEvents().length);
  console.log('IR model interactions\n', model.interactionModel().interactionRecords().length);
  console.log('Frame model frames:\n', model.frameModel().frames().length);
  console.log('Filmstrip model screenshots:\n', model.filmStripModel().frames().length);
  dumpScreenshot(model.filmStripModel());

  const topDown = model.topDown();
  console.log('Top down tree total time:\n', topDown.totalTime);
  console.log('Top down tree, not grouped:\n', dumpTree(topDown, 'totalTime'));

  console.log('Bottom up tree leaves:\n', [...model.bottomUp().children.entries()].length);
  const bottomUpURL = model.bottomUpGroupBy('URL');
  // If there were any resource requests (I think)
  if (bottomUpURL) {
    // const secondTopCost = [...bottomUpURL.children.values()][1];
    console.log('bottom up tree, grouped by URL', dumpTree(bottomUpURL, 'selfTime'));
    // console.log('Bottom up tree, grouped, 2nd top URL:\n', secondTopCost.totalTime.toFixed(2), secondTopCost.id);

    const bottomUpSubdomain = model.bottomUpGroupBy('Subdomain');
    console.log('Bottom up tree, grouped by top subdomain:\n', dumpTree(bottomUpSubdomain, 'selfTime'));

    const bottomUpByName = model.bottomUpGroupBy('EventName');
    console.log('Bottom up tree grouped by EventName:\n', dumpTree(bottomUpByName, 'selfTime'));
  }

  // console.log('Tracing model:\n', model.tracingModel())
  // console.log('Timeline model:\n', model.timelineModel())
  // console.log('IR model:\n', model.interactionModel())
  // console.log('Frame model:\n', model.frameModel())
  // console.log('Filmstrip model:\n', model.filmStripModel())

  // console.log('Top down tree:\n', model.topDown())
  // console.log('Bottom up tree:\n', model.bottomUp())
  // console.log('Top down tree, grouped by URL:\n', model.topDownGroupedUnsorted)
  // console.log('Bottom up tree grouped by URL:\n', model.bottomUpGroupBy('None'))
  console.groupEnd(title);
}

describe('I18n Locale', () => {
  before(() => {
    testPerformance(() => {
      browser.url('/i18n.html');
      testLocale = browser.options.locale || 'en';
      browserLocale = browser.getAttribute('html', 'lang');
    });
  });

  it('Express correctly sets the application locale', () => {
    browser.setValue('#input-wdio-defined', testLocale);
    browser.setValue('#input-actual', browserLocale);
    expect(testLocale).to.equal(browserLocale);
  });

  Terra.should.matchScreenshot({ selector: '#i18n-validation' });
});

describe('test', () => {
  it('does stuff', () => {
    const results = testPerformance(() => {
      browser.url('https://engineering.cerner.com/terra-core/#/tests/terra-avatar/avatar/update-avatar');

      browser.click('#variant');
      browser.click('#initials');
    });
    report(results, 'Avatar Update');
    fs.writeFile('results.json', JSON.stringify(cycle.decycle(results), null, 2));
    /* console.log(testPerformance(() => {
      browser.url('https://engineering.cerner.com/terra-core/#/tests/terra-avatar/avatar/update-avatar');

      browser.click('#variant');
      browser.click('#initials');
    })); */
  });
});
