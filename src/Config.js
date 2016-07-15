// A Config object provides information about how a specific app is
// configured.
// mount is the URL for the root of the API; includes http, domain, etc.

import AppCache from './cache';
import SchemaCache from './Controllers/SchemaCache';
import DatabaseController from './Controllers/DatabaseController';

function removeTrailingSlash(str) {
  if (!str) {
    return str;
  }
  if (str.endsWith("/")) {
    str = str.substr(0, str.length-1);
  }
  return str;
}

export class Config {
  constructor(applicationId: string, mount: string) {
    let cacheInfo = AppCache.get(applicationId);
    if (!cacheInfo) {
      return;
    }

    this.applicationId = applicationId;
    this.masterKey = cacheInfo.masterKey;
    this.clientKey = cacheInfo.clientKey;
    this.javascriptKey = cacheInfo.javascriptKey;
    this.dotNetKey = cacheInfo.dotNetKey;
    this.restAPIKey = cacheInfo.restAPIKey;
    this.webhookKey = cacheInfo.webhookKey;
    this.fileKey = cacheInfo.fileKey;
    this.facebookAppIds = cacheInfo.facebookAppIds;
    this.allowClientClassCreation = cacheInfo.allowClientClassCreation;

    // Create a new DatabaseController per request
    if (cacheInfo.databaseController) {
      this.database = new DatabaseController(cacheInfo.databaseController.adapter, cacheInfo.createSchemaCache());
    }

    this.serverURL = cacheInfo.serverURL;
    this.publicServerURL = removeTrailingSlash(cacheInfo.publicServerURL);
    this.verifyUserEmails = cacheInfo.verifyUserEmails;
    this.preventLoginWithUnverifiedEmail = cacheInfo.preventLoginWithUnverifiedEmail;
    this.appName = cacheInfo.appName;

    this.cacheController = cacheInfo.cacheController;
    this.hooksController = cacheInfo.hooksController;
    this.filesController = cacheInfo.filesController;
    this.pushController = cacheInfo.pushController;
    this.loggerController = cacheInfo.loggerController;
    this.userController = cacheInfo.userController;
    this.authDataManager = cacheInfo.authDataManager;
    this.customPages = cacheInfo.customPages || {};
    this.mount = removeTrailingSlash(mount);
    this.liveQueryController = cacheInfo.liveQueryController;
    this.sessionLength = cacheInfo.sessionLength;
    this.expireInactiveSessions = cacheInfo.expireInactiveSessions;
    this.generateSessionExpiresAt = this.generateSessionExpiresAt.bind(this);
    this.revokeSessionOnPasswordReset = cacheInfo.revokeSessionOnPasswordReset;
  }

  static validate({
    verifyUserEmails,
    userController,
    appName,
    publicServerURL,
    revokeSessionOnPasswordReset,
    expireInactiveSessions,
    sessionLength,
  }) {
    const emailAdapter = userController.adapter;
    if (verifyUserEmails) {
      this.validateEmailConfiguration({emailAdapter, appName, publicServerURL});
    }

    if (typeof revokeSessionOnPasswordReset !== 'boolean') {
      throw 'revokeSessionOnPasswordReset must be a boolean value';
    }

    if (publicServerURL) {
      if (!publicServerURL.startsWith("http://") && !publicServerURL.startsWith("https://")) {
        throw "publicServerURL should be a valid HTTPS URL starting with https://"
      }
    }

    this.validateSessionConfiguration(sessionLength, expireInactiveSessions);
  }

  static validateEmailConfiguration({emailAdapter, appName, publicServerURL}) {
    if (!emailAdapter) {
      throw 'An emailAdapter is required for e-mail verification and password resets.';
    }
    if (typeof appName !== 'string') {
      throw 'An app name is required for e-mail verification and password resets.';
    }
    if (typeof publicServerURL !== 'string') {
      throw 'A public server url is required for e-mail verification and password resets.';
    }
  }

  get mount() {
    var mount = this._mount;
    if (this.publicServerURL) {
      mount = this.publicServerURL;
    }
    return mount;
  }

  set mount(newValue) {
    this._mount = newValue;
  }

  static validateSessionConfiguration(sessionLength, expireInactiveSessions) {
    if (expireInactiveSessions) {
      if (isNaN(sessionLength)) {
        throw 'Session length must be a valid number.';
      }
      else if (sessionLength <= 0) {
        throw 'Session length must be a value greater than 0.'
      }
    }
  }

  generateSessionExpiresAt() {
    if (!this.expireInactiveSessions) {
      return undefined;
    }
    var now = new Date();
    return new Date(now.getTime() + (this.sessionLength*1000));
  }

  get invalidLinkURL() {
    return this.customPages.invalidLink || `${this.publicServerURL}/apps/invalid_link.html`;
  }

  get verifyEmailSuccessURL() {
    return this.customPages.verifyEmailSuccess || `${this.publicServerURL}/apps/verify_email_success.html`;
  }

  get choosePasswordURL() {
    return this.customPages.choosePassword || `${this.publicServerURL}/apps/choose_password`;
  }

  get requestResetPasswordURL() {
    return `${this.publicServerURL}/apps/${this.applicationId}/request_password_reset`;
  }

  get passwordResetSuccessURL() {
    return this.customPages.passwordResetSuccess || `${this.publicServerURL}/apps/password_reset_success.html`;
  }

  get verifyEmailURL() {
    return `${this.publicServerURL}/apps/${this.applicationId}/verify_email`;
  }
}

export default Config;
module.exports = Config;
