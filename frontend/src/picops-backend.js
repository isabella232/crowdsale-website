import BigNumber from 'bignumber.js';

import config from './stores/config.store';
import { get, post, sleep } from './utils';
import Logger from './logger';

const logger = Logger('backend-picops');

class PicopsBackend {
  constructor () {
    config.ready(this.init);
  }

  init = () => {
    const picopsUrl = config.get('picopsUrl');

    this._url = picopsUrl;
  }

  get baseUrl () {
    return this._url;
  }

  url (path) {
    return `${this.baseUrl}/api${path}`;
  }

  async errorHandler (error, attempts, callback) {
    console.warn('got an error', error, error.status);

    // Can retry up to 5 times if not client error
    if ((error.status < 400 || error.status >= 500) && attempts < 4) {
      const timeout = Math.floor(Math.pow(1.6, attempts) * 1000);

      logger.warn(`[${error.status}] ${error.message} - will retry in ${Math.round(timeout / 1000)}s`);
      await sleep(timeout);
      return callback();
    }

    throw error;
  }

  async get (path, attempts = 0) {
    try {
      const result = await get(this.url(path));

      return result;
    } catch (error) {
      return this.errorHandler(error, attempts, async () => this.get(path, attempts + 1));
    }
  }

  async post (path, params, attempts = 0) {
    try {
      const result = await post(this.url(path), params);

      return result;
    } catch (error) {
      return this.errorHandler(error, attempts, async () => this.post(path, params, attempts + 1));
    }
  }

  async getAccountFeeInfo (address) {
    const { balance, paid, origins } = await this.get(`/accounts/${address}/fee`);

    return {
      balance: new BigNumber(balance),
      paid,
      origins
    };
  }

  async fee () {
    const { fee, feeRegistrar } = await this.get(`/fee`);

    return { fee: new BigNumber(fee), feeRegistrar };
  }

  async sendTx (tx) {
    const { hash } = await this.post('/fee-tx', { tx });

    return { hash };
  }
}

export default new PicopsBackend();
