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
    const {
      chainId,
      etherscan,
      gasPrice,
      picopsUrl,
      saleWebsite
    } = await get(this.url('/config'));

    return {
      chainId: parseInt(chainId),
      etherscan,
      gasPrice: new BigNumber(gasPrice),
      picopsUrl,
      saleWebsite
    };
  }

  async status () {
    const {
      block,
      connected,

      currentBonus,
      currentPrice,
      endTime,
      tokensAvailable,
      totalAccounted,
      totalReceived
    } = await get(this.url('/auction'));

    return {
      block,
      connected,

      currentBonus: new BigNumber(currentBonus),
      currentPrice: new BigNumber(currentPrice),
      endTime: new Date(endTime),
      tokensAvailable: new BigNumber(tokensAvailable),
      totalAccounted: new BigNumber(totalAccounted),
      totalReceived: new BigNumber(totalReceived)
    };
  }

  async sale () {
    const {
      DUST_LIMIT,
      STATEMENT_HASH,
      STATEMENT,
      BONUS_LATCH,
      BONUS_MIN_DURATION,
      BONUS_MAX_DURATION,
      DIVISOR,
      USDWEI,

      admin,
      beginTime,
      certifier,
      tokenCap,
      tokenContract,
      treasury,

      contractAddress
    } = await get(this.url('/auction/constants'));

    return {
      DUST_LIMIT: new BigNumber(DUST_LIMIT),
      STATEMENT_HASH,
      STATEMENT,
      BONUS_LATCH: new BigNumber(BONUS_LATCH),
      BONUS_MIN_DURATION: new BigNumber(BONUS_MIN_DURATION),
      BONUS_MAX_DURATION: new BigNumber(BONUS_MAX_DURATION),
      DIVISOR: new BigNumber(DIVISOR),
      USDWEI: new BigNumber(USDWEI),

      admin,
      beginTime: new Date(beginTime),
      certifier,
      tokenCap: new BigNumber(tokenCap),
      tokenContract,
      treasury,

      contractAddress
    };
  }

  url (path) {
    return `${this._url}/api${path}`;
  }

  async certifierAddress () {
    const { certifier } = await get(this.url(`/certifier`));

    return certifier;
  }

  async dummyDeal () {
    const { accounted, refund, price, value } = await get(this.url(`/auction/dummy-deal`));

    return {
      accounted: new BigNumber(accounted),
      price: new BigNumber(price),
      value: new BigNumber(value),

      refund
    };
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
