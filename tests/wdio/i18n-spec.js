/* global browser, describe, it, before, expect, Terra */
const TraceToTimelineModel = require('devtools-timeline-model');

let testLocale;
let browserLocale;

/* From: https://github.com/GoogleChrome/lighthouse/blob/e9e0e8ef3a0f513dd3335f46dcd15279767ad5d7/lighthouse-core/config/config.js#L29-L110 */
// cleanTrace is run to remove duplicate TracingStartedInPage events,
// and to change TracingStartedInBrowser events into TracingStartedInPage.
// This is done by searching for most occuring threads and basing new events
// off of those.
function cleanTrace(traceEvents) {
  // Keep track of most occuring threads
  const threads = [];
  const countsByThread = {};
  const traceStartEvents = [];
  const makeMockEvent = (evt, ts) => ({
    pid: evt.pid,
    tid: evt.tid,
    ts: ts || 0, // default to 0 for now
    ph: 'I',
    cat: 'disabled-by-default-devtools.timeline',
    name: 'TracingStartedInPage',
    args: {
      data: {
        page: evt.frame,
      },
    },
    s: 't',
  });

  let frame;
  let data;
  let name;
  let counter;

  traceEvents.forEach((evt, idx) => {
    if (evt.name.startsWith('TracingStartedIn')) {
      traceStartEvents.push(idx);
    }

    // find the event's frame
    data = evt.args && (evt.args.data || evt.args.beginData || evt.args.counters);
    frame = (evt.args && evt.args.frame) || (data && (data.frame || data.page));

    if (!frame) {
      return;
    }

    // Increase occurences count of the frame
    name = `pid${evt.pid}-tid${evt.tid}-frame${frame}`;
    counter = countsByThread[name];
    if (!counter) {
      counter = {
        pid: evt.pid,
        tid: evt.tid,
        frame,
        count: 0,
      };
      countsByThread[name] = counter;
      threads.push(counter);
    }
    counter.count += 1;
  });

  if (traceStartEvents.length === 0 || !counter) {
    return traceEvents;
  }

  // find most active thread (and frame)
  threads.sort((a, b) => b.count - a.count);
  const mostActiveFrame = threads[0];

  // Remove all current TracingStartedIn* events, storing
  // the first events ts.
  const ts = traceEvents[traceStartEvents[0]] && traceEvents[traceStartEvents[0]].ts;

  // account for offset after removing items
  let i = 0;
  traceStartEvents.forEach((dup) => {
    traceEvents.splice(dup - i, 1);
    i += 1;
  });

  // Add a new TracingStartedInPage event based on most active thread
  // and using TS of first found TracingStartedIn* event
  traceEvents.unshift(makeMockEvent(mostActiveFrame, ts));

  return traceEvents;
}

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
  const model = new TraceToTimelineModel(events);

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
    // Flush old performance logs
    browser.log('performance');
    browser.url('/i18n.html');

    const perfLogs = browser.log('performance');

    let rawEvents = [];
    let itemMessage;
    perfLogs.value.forEach((item) => {
      itemMessage = JSON.parse(item.message);
      if (itemMessage.message.params.cat && itemMessage.message.params.name) {
        rawEvents = rawEvents.concat(itemMessage.message.params);
      }
    });

    rawEvents = cleanTrace(rawEvents);

    report(rawEvents, 'Page load test');

    testLocale = browser.options.locale || 'en';
    browserLocale = browser.getAttribute('html', 'lang');
  });

  it('Express correctly sets the application locale', () => {
    // Flush old performance logs
    browser.log('performance');
    browser.setValue('#input-wdio-defined', testLocale);
    browser.setValue('#input-actual', browserLocale);
    expect(testLocale).to.equal(browserLocale);
    const perfLogs = browser.log('performance');

    let rawEvents = [];
    let itemMessage;
    perfLogs.value.forEach((item) => {
      itemMessage = JSON.parse(item.message);
      if (itemMessage.message.params.cat && itemMessage.message.params.name) {
        rawEvents = rawEvents.concat(itemMessage.message.params);
      }
    });

    rawEvents = cleanTrace(rawEvents);

    report(rawEvents, 'Locale test');
  });

  Terra.should.matchScreenshot({ selector: '#i18n-validation' });
});

describe('test', () => {
  it('does stuff', () => {
    browser.log('performance');

    browser.url('https://engineering.cerner.com/terra-core/#/tests/terra-avatar/avatar/update-avatar');

    browser.click('#variant');
    browser.click('#initials');

    const perfLogs = browser.log('performance');

    let rawEvents = [];
    let itemMessage;
    perfLogs.value.forEach((item) => {
      itemMessage = JSON.parse(item.message);
      if (itemMessage.message.params.cat && itemMessage.message.params.name) {
        rawEvents = rawEvents.concat(itemMessage.message.params);
      }
    });

    rawEvents = cleanTrace(rawEvents);

    report(rawEvents, 'Avatar test');
  });
});
