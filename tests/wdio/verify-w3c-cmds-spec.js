/**
* Webdriver.io provids several commands for testing which either use the JsonWireProtocol, W3C Protocol,
* and/or Appium specific Protocols for mobile testing. 
* 
* These tests verify W3C commands provided by webdriver.io and these tests can be run to verify valid commands
* when leveraging & verifying a selenium driver version change.
*/
const validProtocolCmds = [
  'actions',
  'alertAccept',
  'alertDismiss',
  'alertText',
  'back',
  'cookie',
  'element',
  'elementActive',
  'elementIdAttribute',
  'elementIdClear',
  'elementIdClick',
  'elementIdCssProperty',
  'elementIdDisplayed',
  'elementIdElement',
  'elementIdElements',
  'elementIdEnabled',
  'elementIdName',
  'elementIdProperty',
  'elementIdRect',
  'elementIdScreenshot',
  'elementIdSelected',
  'elementIdSize',
  'elementIdText',
  'elementIdValue',
  'elements',
  'execute',
  'executeAsync',
  'forward',
  'frame',
  'frameParent',
  'init',
  'keys',
  'refresh',
  'screenshot',
  'session',
  'source',
  'timeouts',
  'title',
  'url',
  'window',
  'windowHandle',
  'windowHandleFullscreen',
  'windowHandleMaximize',
  'windowHandlPosition',
  'windowHandleSize',
  'windowHandles'
]

const validActionCmds = [
  'addValue',
  'clearElement',
  'click',
  'selectByAttribute',
  'selectByIndex',
  'selectByValue',
  'selectByVisibleText',
  'selectorExecute',
  'selectorExecuteAsync',
  'setValue',
];

const validCookieCmds = [
  'deleteCookie',
  'getCookie',
  'setCookie',
];

const validPropertyCmds = [
  'getAttribute',
  'getCssProperty',
  'getElementSize',
  'getHTML',
  'getSource',
  'getText',
  'getTitle',
  'getUrl',
  'getValue',
];

const validStateCmds = [
  'hasFocus',
  'isEnabled',
  'isExisting',
  'isSelected',
  'isVisible',
  'isVisisbleWithinViewport',
];

const validUtilityCmds = [
  '$',
  '$$',
  'debug',
  'end',
  'getCommandHistory',
  'pause',
  'reload',
  'saveScreenshot',
  'waitForEnabled',
  'waitForExist',
  'waitForSelected',
  'waitForText',
  'waitForValue',
  'waitForVisisble',
  'waitUntil'
];

const validWindowCmd = [
  'close',
  'getCurrentTabId',
  'getTabIds',
  'getViewportSize',
  'newWindow',
  'setViewportSize',
  'switchTab'
]

describe('verify wdio w3c commands', () => {

  describe('protocol', () => {


  });
});
