import BigNumber from 'bignumber.js';

import { get, post } from './utils';

class Backend {
  constructor (url) {
    this._url = url;
  }

  blockHash () {
    return get(this.url('/block/hash'));
  }

  async chartData () {
    return get(this.url('/auction/chart'));
  }

  async config () {
    const { chainId, gasPrice, picopsUrl } = await get(this.url('/config'));

    return {
      chainId: parseInt(chainId),
      gasPrice: new BigNumber(gasPrice),
      picopsUrl
    };
  }

  status () {
    return get(this.url('/auction'));
  }

  sale () {
    return get(this.url('/auction/constants'));
  }

  url (path) {
    return `${this._url}/api${path}`;
  }

  async certifierAddress () {
    const { certifier } = await get(this.url(`/certifier`));

    return certifier;
  }

  async getAddressInfo (address) {
    const { eth, accounted, certified } = await get(this.url(`/accounts/${address}`));

    return {
      eth: new BigNumber(eth),
      accounted: new BigNumber(accounted),
      certified
    };
  }

  async nonce (address) {
    const { nonce } = await get(this.url(`/accounts/${address}/nonce`));

    return nonce;
  }

  async sendTx (tx) {
    const { hash, requiredEth } = await post(this.url('/tx'), { tx });

    return { hash, requiredEth };
  }

  async txStatus (txHash) {
    return get(this.url(`/auction/tx/${txHash}`));
  }
}

const { protocol, hostname, port } = window.location;
const frontendPort = port ? `:${port}` : '';

export default new Backend(`${protocol}//${hostname}${frontendPort}`);
