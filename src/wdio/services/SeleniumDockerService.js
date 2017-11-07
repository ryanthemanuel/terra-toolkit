import { execSync } from 'child_process';
import retry from 'async/retry';
import http from 'http';
import path from 'path';
import fs from 'fs';

/**
* Webdriver.io SeleniuMDockerService
* provides standalone chrome/firefox selenium docker automation.
*/
export default class SeleniumDockerService {
  constructor() {
    this.getSeleniumStatus = this.getSeleniumStatus.bind(this);
  }

  getSeleniumStatus(callback) {
    console.log('getting selenium status ' + this.host);
    http.get({
      host: this.host,
      port: this.port,
      path: path.join(this.path || '/wd/hub', 'status'),
    }, (res) => {
      const { statusCode } = res;
      if (statusCode !== 200) {
        console.log('Request failed: ' + statusCode);
        callback('Request failed');
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const status = JSON.parse(rawData);
          if (status.value && status.value.ready) {
            callback(null, status);
          } else {
            callback(status);
          }
        } catch (e) {
          callback(`Request failed: ${e.message}`);
        }
      });
    }).on('error', (e) => {
      console.log('Error: ' + e.message);
      callback(`Request failed: ${e.message}`);
    });
  }

  /**
   * Start up docker container before all workers get launched.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   */
  onPrepare(config, capabilities) {
    this.config = {
      cidfile: '.docker_selenium_id', // The docker container id file
      enabled: true, // True if service enabled, false otherwise
      cleanup: false, // True if docker container should be removed after test
      image: null, // The image name to use, defaults to selenium/standalone-${browser}
      ...(config.seleniumDocker || {}),
    };
    this.host = config.host;
    this.port = config.port;
    this.path = config.path;
    this.browserName = capabilities[0].browserName;
    this.cidfile = this.config.cidfile || this.cidfile;

    console.log('Returning Promise');

    return new Promise((resolve, reject) => {
      console.log('On Prepare Promise ' + this.config.toString());
      if (this.config.enabled) {
        const containerId = this.getContainerId();
        if (!containerId) {
          execSync(`docker pull ${this.getImage()}`);
          const dockerString = `docker run -d --rm --cidfile ${this.cidfile} -p ${config.port}:4444 ${this.getImage()}`;
          console.log(dockerString);
          const updatedContainerId = execSync(dockerString, (err, stdout, stderr) => {
            console.log('Error after docker ' + err);
            console.log('stdout after docker ' + stdout);
            console.log('stderr after docker ' + stderr);
          });

          console.log('Updated Container Id ' + updatedContainerId);

          const dockerHostString = `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${updatedContainerId}`;
          console.log(dockerHostString);
          this.host = String(execSync(dockerHostString)).trim();
          config.host = this.host;
          console.log(typeof this.host);
          console.log('Host!!!! ' + this.host);
        }
        // Retry for 500 times up to 5 seconds for selenium to start
        retry({ times: 500, interval: 10 }, this.getSeleniumStatus, (err, result) => {
          if (err) {
            console.log('Error ' + err);
            reject(err);
          } else {
            console.log('Success ' + result);
            resolve(result);
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the docker image to use based on configuration and browser capabilities.
   * @return The name of the docker image to use.
   */
  getImage() {
    // Use configured image or infer image from browserName (only firefox and safari supported).
    // TODO: Eventually an entire hub should be stood up which supports all browsers in capabilities config
    return this.config.image || `selenium/standalone-${this.browserName}`;
  }

  /**
  * Get the contianer id from the cidfile.
  * @return The docker container id or null if the file does not exist.
  */
  getContainerId() {
    let containerId;
    if (fs.existsSync(this.cidfile)) {
      containerId = fs.readFileSync(this.cidfile, 'utf8');
    }
    return containerId;
  }

  /**
   * Clean up docker container after all workers got shut down and the process is about to exit.
   */
  onComplete() {
    if (this.config.cleanup) {
      const containerId = this.getContainerId();
      if (containerId) {
        execSync(`docker stop ${containerId}`);
        fs.unlinkSync(this.cidfile);
      }
    }
  }
}