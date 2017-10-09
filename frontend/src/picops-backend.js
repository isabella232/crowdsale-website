import BigNumber from 'bignumber.js';

import config from './stores/config.store';
import { get, post } from './utils';

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

  async getAccountFeeInfo (address) {
    const { balance, paid, origins } = await get(this.url(`/accounts/${address}/fee`));

    return {
      balance: new BigNumber(balance),
      paid,
      origins
    };
  }

  async fee () {
    const { fee, feeRegistrar } = await get(this.url(`/fee`));

    return { fee: new BigNumber(fee), feeRegistrar };
  }

  async sendTx (tx) {
    const { hash } = await post(this.url('/fee-tx'), { tx });

    return { hash };
  }
}

export default new PicopsBackend();
