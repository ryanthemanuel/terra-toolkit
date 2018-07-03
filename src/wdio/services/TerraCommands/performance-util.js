const TraceToTimelineModel = require('devtools-timeline-model');
const fs = require('fs');

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

  // Can happen if no events have a frame
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

const gatherPerformanceLogs = (toTest) => {
  // Flush old performance logs
  global.browser.log('performance');

  toTest();

  const perfLogs = global.browser.log('performance');

  let rawEvents = [];
  let itemMessage;
  perfLogs.value.forEach((item) => {
    itemMessage = JSON.parse(item.message);
    if (itemMessage.message.params.cat && itemMessage.message.params.name) {
      rawEvents.push(itemMessage.message.params);
    }
  });

  rawEvents = cleanTrace(rawEvents);

  fs.writeFile('trace', JSON.stringify(rawEvents, null, 2));

  return new TraceToTimelineModel(rawEvents);
};

const getScriptRuntime = (toTest, scriptRegex) => {
  const perfLogs = gatherPerformanceLogs(toTest);
  const bottomUpURL = perfLogs.bottomUpGroupBy('URL');

  const keys = Array.from(bottomUpURL.children.keys());
  const scriptName = keys.find(key => scriptRegex.test(key));
  if (!scriptName) {
    throw Error(`Script Search Regex ${scriptRegex} has no matches`);
  }

  return bottomUpURL.children.get(scriptName).totalTime;
};

module.exports.gatherPerformanceLogs = gatherPerformanceLogs;
module.exports.getScriptRuntime = getScriptRuntime;
