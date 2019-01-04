const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const getObjectsData = async (prefix) => {
  const objectsData = await s3.listObjectsV2({
    Bucket: process.env.TRAVIS_PULL_REQUEST_SLUG.replace(/[?<>/\\|*":+.]/g, '-'),
    Prefix: prefix,
  }).promise();
  return objectsData.Contents.map(object => object.Key);
};

const deleteObjects = async () => {
  const deleteObjectArray = (await getObjectsData('diff')).concat(await getObjectsData('latest')).map((object) => {
    const keyObject = { Key: object };
    return keyObject;
  });
  console.log(deleteObjectArray);

  return s3.deleteObjects({
    Bucket: process.env.TRAVIS_PULL_REQUEST_SLUG.replace(/[?<>/\\|*":+.]/g, '-'),
    Delete: {
      Objects: deleteObjectArray,
    },
  }).promise();
};

deleteObjects().then(() => console.log('Successfully Cleaned'));
