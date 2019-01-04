import BaseCompare from 'wdio-visual-regression-service/lib/methods/BaseCompare';
import resemble from 'node-resemble-js';
import get from 'lodash.get';
import AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-east-1',
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
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

  static async bucketExists(bucketName) {
    const bucketExists = await s3.headBucket({
      Bucket: bucketName,
    }).promise().then((data) => {
      console.log(`Success: ${data}`);
      return Promise.resolve(true);
    }).catch((error) => {
      console.log(`Failure: ${error}`);
      return Promise.resolve(false);
    });
    console.log(`Bucket exists: ${bucketExists}`);
    return bucketExists;
  }

  async processScreenshot(context, base64Screenshot) {
    const bucketName = process.env.TRAVIS_PULL_REQUEST_SLUG.replace(/[?<>/\\|*":+.]/g, '-');
    const bucketExists = await TerraCompare.bucketExists(bucketName);
    if (!bucketExists) {
      console.log('Creating bucket');
      await s3.createBucket({
        Bucket: bucketName,
        ACL: 'public-read',
      }).promise().then((data) => {
        console.log(`Success: ${data}`);
      }).catch((error) => {
        console.log(`Failure: ${error}`);
      });
    }

    const screenshotPath = this.getScreenshotFile(context);
    const referencePath = this.getReferenceFile(context);
    const diffPath = this.getDiffFile(context);

    const referenceData = await s3.getObject({
      Bucket: bucketName,
      Key: referencePath,
    }).promise().then(data => Promise.resolve(data.Body)).catch(() => Promise.resolve(undefined));
    const capturedData = Buffer.from(base64Screenshot, 'base64');

    if (referenceData) {
      console.log('Comparing');
      const ignoreComparison = get(context, 'options.ignoreComparison', this.ignoreComparison);

      const compareData = await TerraCompare.compareImages(referenceData, capturedData, ignoreComparison);
      console.log(compareData);

      const misMatchPercentage = Number(compareData.misMatchPercentage);
      const misMatchTolerance = get(context, 'options.misMatchTolerance', this.misMatchTolerance);

      if (misMatchPercentage > misMatchTolerance) {
        const png = compareData.getDiffImage().pack();
        const diffImageData = await TerraCompare.createDiff(png);

        await s3.upload({
          ACL: 'public-read',
          Bucket: bucketName,
          Key: diffPath,
          Body: diffImageData,
          ContentType: 'image/png',
        }).promise().catch((error) => {
          console.log(error);
          return Promise.reject(error);
        });
      }
    } else {
      await s3.upload({
        ACL: 'public-read',
        Bucket: bucketName,
        Key: referencePath,
        Body: capturedData,
        ContentType: 'image/png',
      }).promise().catch((error) => {
        console.log(error);
        return Promise.reject(error);
      });
    }

    await s3.upload({
      ACL: 'public-read',
      Bucket: bucketName,
      Key: screenshotPath,
      Body: capturedData,
      ContentType: 'image/png',
      Metadata: {
        referencekey: referencePath,
        diffkey: diffPath,
      },
    }).promise().catch((error) => {
      console.log(error);
      return Promise.reject(error);
    });

    console.log('Returning');

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
  static async createDiff(png) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      png.on('data', (chunk) => {
        chunks.push(chunk);
      });
      png.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      png.on('error', err => reject(err));
    });
  }
}
