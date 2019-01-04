const octokit = require('@octokit/rest');
const AWS = require('aws-sdk');

const [owner, repo] = process.env.TRAVIS_PULL_REQUEST_SLUG.split('/');

const getObjectsData = async () => {
  const s3 = new AWS.S3();
  const objectsData = await s3.listObjectsV2({
    Bucket: process.env.TRAVIS_PULL_REQUEST_SLUG.replace(/[?<>/\\|*":+.]/g, '-'),
    Prefix: 'diff',
  }).promise();
  return objectsData.Contents.map(object => object.key);
};

const createStatus = async () => {
  const octokitInstance = octokit({
    timeout: 0, // 0 means no request timeout
    headers: {
      accept: 'application/vnd.github.v3+json',
      'user-agent': 'octokit/rest.js v15.9.0', // v1.2.3 will be current version
    },
  });
  octokitInstance.authenticate({
    type: 'oauth',
    token: process.env.STATUS_GITHUB_API_TOKEN,
  });

  octokitInstance.repos.createStatus({
    owner,
    repo,
    sha: process.env.TRAVIS_PULL_REQUEST_SHA,
    state: (await getObjectsData()).length > 0 ? 'pending' : 'success',
    context: 'manuel status',
  }).then((result) => {
    console.log(result);
  }).catch((error) => {
    console.log(error);
  });
};

createStatus().then(() => console.log('Status created'));
