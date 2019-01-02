import fs from 'fs-extra';
import BaseCompare from 'wdio-visual-regression-service/lib/methods/BaseCompare';
import resemble from 'node-resemble-js';
import get from 'lodash.get';
import AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-east-1',
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: 'comparescreenshotsstack-screenshotbucket-1jv69rl51vze7' },
});

export default class TerraCompare extends BaseCompare {
  constructor(options = {}) {
    super();
    this.getScreenshotFile = options.screenshotName;
    this.getReferenceFile = options.referenceName;
    this.getDiffFile = options.diffName;
    this.misMatchTolerance = get(options, 'misMatchTolerance', 0.01);
    this.ignoreComparison = get(options, 'ignoreComparison', 'nothing');
  }

  async processScreenshot(context, base64Screenshot) {
    const screenshotPath = this.getScreenshotFile(context);
    const referencePath = this.getReferenceFile(context);
    const diffPath = this.getDiffFile(context);

    // await fs.outputFile(screenshotPath, base64Screenshot, 'base64');

    // console.log(`https://s3.amazonaws.com/comparescreenshotsstack-screenshotbucket-1jv69rl51vze7/${referencePath.slice(1)}`);
    // const referenceExists = await fs.exists(`https://s3.amazonaws.com/comparescreenshotsstack-screenshotbucket-1jv69rl51vze7/${referencePath.slice(1)}`);

    const referenceData = await s3.getObject({
      Key: referencePath,
    }).promise().then(data => Promise.resolve(data.Body)).catch(() => Promise.resolve(undefined));

    if (!referenceData) {
      // console.log('comparing');
      // const captured = Buffer.from(base64Screenshot, 'base64');
      // const ignoreComparison = get(context, 'options.ignoreComparison', this.ignoreComparison);

      // console.time('compare');
      // const compareData = await TerraCompare.compareImages(referenceData, captured, ignoreComparison);
      // console.timeEnd('compare');

      // const { isSameDimensions } = compareData;
      // const misMatchPercentage = Number(compareData.misMatchPercentage);
      // const misMatchTolerance = get(context, 'options.misMatchTolerance', this.misMatchTolerance);

      // const diffPath = this.getDiffFile(context);

      // if (misMatchPercentage > misMatchTolerance) {
      //   const png = compareData.getDiffImage().pack();
      //   await TerraCompare.writeDiff(png, diffPath);

      //   return this.createResultReport(misMatchPercentage, false, isSameDimensions);
      // }

      // await fs.remove(diffPath);

      // return this.createResultReport(misMatchPercentage, true, isSameDimensions);

      await s3.upload({
        ACL: 'public-read',
        Key: referencePath,
        Body: Buffer.from(base64Screenshot, 'base64'),
        ContentType: 'image/png',
      }).promise().catch((error) => {
        console.log(error);
        return Promise.reject(error);
      });
    }

    console.time('upload');
    await s3.upload({
      ACL: 'public-read',
      Key: screenshotPath,
      Body: Buffer.from(base64Screenshot, 'base64'),
      ContentType: 'image/png',
      Metadata: {
        referencekey: referencePath,
        diffkey: diffPath,
      },
    }).promise().catch((error) => {
      console.log(error);
      return Promise.reject(error);
    });
    console.timeEnd('upload');

    // await fs.outputFile(referencePath, base64Screenshot, 'base64');

    return this.createResultReport(0, true, true);
  }

  /**
   * Compares two images with resemble
   * @param  {Buffer|string} reference path to reference file or buffer
   * @param  {Buffer|string} screenshot path to file or buffer to compare with reference
   * @return {{misMatchPercentage: Number, isSameDimensions:Boolean, getImageDataUrl: function}}
   */
  static async compareImages(reference, screenshot, ignore = '') {
    return new Promise((resolve) => {
      const image = resemble(reference).compareTo(screenshot);

      switch (ignore) {
        case 'colors':
          image.ignoreColors();
          break;
        case 'antialiasing':
          image.ignoreAntialiasing();
          break;
        default:
      }

      image.onComplete((data) => {
        resolve(data);
      });
    });
  }


  /**
   * Writes provided diff by resemble as png
   * @param  {Stream} png node-png file Stream.
   * @return {Promise}
   */
  static async writeDiff(png, filepath) {
    await new Promise((resolve, reject) => {
      const chunks = [];
      png.on('data', (chunk) => {
        chunks.push(chunk);
      });
      png.on('end', () => {
        const buffer = Buffer.concat(chunks);

        Promise
          .resolve()
          .then(() => fs.outputFile(filepath, buffer.toString('base64'), 'base64'))
          .then(() => resolve())
          .catch(reject);
      });
      png.on('error', err => reject(err));
    });
  }
}
