import BigNumber from 'bignumber.js';

import { get, post, sleep } from './utils';
import Logger from './logger';

const logger = Logger('backend');

class Backend {
  constructor (url) {
    this._url = url;
  }

  url (path) {
    return `${this._url}/api${path}`;
  }

  async errorHandler (error, attempts, callback) {
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

  async balance (address) {
    const { balance } = await this.get(`/accounts/${address}/balance`);

    return new BigNumber(balance);
  }

  async blockHash () {
    return this.get('/block/hash');
  }

  async chartData (since) {
    return this.get(`/auction/chart${since ? `?since=${since}` : ''}`);
  }

  async certifierAddress () {
    const { certifier } = await this.get('/certifier');

    return certifier;
  }

  async config () {
    const {
      chainId,
      etherscan,
      gasPrice,
      picopsUrl,
      saleWebsite
    } = await this.get('/config');

    return {
      chainId: parseInt(chainId),
      etherscan,
      gasPrice: new BigNumber(gasPrice),
      picopsUrl,
      saleWebsite
    };
  }

  async dummyDeal () {
    const { accounted, refund, price, value } = await this.get('/auction/dummy-deal');

    return {
      accounted: new BigNumber(accounted),
      price: new BigNumber(price),
      value: new BigNumber(value),

      refund
    };
  }

  async getAddressInfo (address) {
    const { eth, accounted, certified, received } = await this.get(`/accounts/${address}`);

    return {
      eth: new BigNumber(eth),
      accounted: new BigNumber(accounted),
      received: new BigNumber(received),
      certified
    };
  }

  async nonce (address) {
    const { nonce } = await this.get(`/accounts/${address}/nonce`);

    return nonce;
  }

  async sale () {
    const {
      DUST_LIMIT,
      STATEMENT_HASH,
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
    } = await this.get('/auction/constants');

    return {
      DUST_LIMIT: new BigNumber(DUST_LIMIT),
      STATEMENT_HASH,
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

  async sendTx (tx) {
    const { hash, requiredEth } = await this.post('/tx', { tx });

    return { hash, requiredEth };
  }

  async status () {
    const {
      block,
      connected,

      currentBonus,
      currentPrice,
      endTime,
      halted,
      tokensAvailable,
      totalAccounted,
      totalReceived
    } = await this.get('/auction');

    return {
      block,
      connected,

      currentBonus: new BigNumber(currentBonus),
      currentPrice: new BigNumber(currentPrice),
      endTime: new Date(endTime),
      halted,
      tokensAvailable: new BigNumber(tokensAvailable),
      totalAccounted: new BigNumber(totalAccounted),
      totalReceived: new BigNumber(totalReceived)
    };
  }

  async txStatus (txHash) {
    return this.get(`/auction/tx/${txHash}`);
  }
}

const { protocol, hostname, port } = window.location;
const frontendPort = port ? `:${port}` : '';

export default new Backend(`${protocol}//${hostname}${frontendPort}`);
