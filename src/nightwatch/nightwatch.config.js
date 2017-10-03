/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "chromedriver" }] */

import chromedriver from 'chromedriver';
import { execSync } from 'child_process';
import { sync as rimrafSync } from 'rimraf';

const nightwatchConfig = (srcFolders) => {

  const endBrowserSession = (browser, done) => browser.end(done);

  const config = {
    selenium: {
      start_process: false,
    },
    src_folders: srcFolders,
    output_folder: 'reports',
    custom_commands_path: '',
    custom_assertions_path: '',
    page_objects_path: '',
    persist_globals: true,
    test_workers: false,
    test_settings: {
      default: {
        launch_url: 'http://localhost',
        persist_globals: true,
        selenium_port: 9515,
        selenium_host: 'localhost',
        default_path_prefix: '',
        silent: true,
        globals: {
          breakpoints: {
            tiny: [470, 768],
            small: [622, 768],
            medium: [838, 768],
            large: [1000, 768],
            huge: [1300, 768],
            enormous: [1500, 768],
          },
          asyncHookTimeout: 30000,
          waitForConditionTimeout: 1000,
          retryAssertionTimeout: 1000,
          before: (done) => {
            chromedriver.start();
            rimrafSync('.storybook-nightwatch');
            execSync('npm run storybook:build -- -o .storybook-nightwatch');
            done();
          },
          after: (done) => {
            chromedriver.stop();
            rimrafSync('.storybook-nightwatch');
            done();
          },
          //afterEach: endBrowserSession,
        },
        filter: '**/*-spec.js',
        screenshots: {
          enabled: true,
          on_failure: true,
          on_error: true,
          path: './screenshots',
        },
        desiredCapabilities: {
          browserName: 'chrome',
          javascriptEnabled: true,
          acceptSslCerts: true,
          chromeOptions: {
            args: [
              '--headless',
              '--no-sandbox',
            ],
          },
        },
      },
    },
  };
  return config;
};

export default nightwatchConfig;
