const testPerformance = require('./performance-util');

/**
* A mocha-chai convenience test case to assert performance.
*/
const runInUnder = (toTest, scriptToTest, timelimit) => {
  global.it(`should run in under ${timelimit} ms`, () => {
    const performanceResults = testPerformance(toTest);
    global.expect().to.be.accessible();
  });
};

/**
 * Terra.should.startPerformanceTest()
 * <stuff to test>
 * Terra.should.haveRanInUnder('terra-dev-site', 1000);
 *
 *
 * Terra.should.havePaintedInUnder()
 */

const methods = {
  runInUnder,
};

export default methods;
