import BigNumber from 'bignumber.js';
import { ecsign } from 'ethereumjs-util';
import { action, observable } from 'mobx';

import appStore from './app.store';
import auctionStore, { TSCS_HASH } from './auction.store';
import blockStore from './block.store';
import backend from '../backend';
import config from './config.store';
import Transaction from './transaction';
import { hex2buf, hex2bn, buildABIData } from '../utils';

const BUYIN_SIG = '0xd0280037';
const GAS_LIMIT = new BigNumber(200000);

class BuyStore {
  @observable accounted;
  @observable received;
  @observable success;

  // The transaction hash for the Sale contract
  @observable transaction;

  constructor () {
    // Init once the config is loaded
    config.ready(this.init);
  }

  init = () => {
    this.accounted = null;
    this.success = null;
  }

  get totalGas () {
    return GAS_LIMIT.mul(config.get('gasPrice') || 0);
  }

  async checkPurchase () {
    if (!this.transaction) {
      return;
    }

    const result = await backend.txStatus(this.transaction);

    if (result.status === 'unkown') {
      return;
    }

    const success = result.status === 'success';

    this.setInfo({
      accounted: success ? hex2bn(result.accounted) : null,
      received: success ? hex2bn(result.received) : null,
      success
    });

    appStore.goto('summary');
  }

  async purchase (address, spending, privateKey) {
    console.warn('buying tokens for', spending.toFormat());

    const { contractAddress } = auctionStore;

    if (!address || !privateKey) {
      throw new Error('no address or no private key');
    }

    try {
      const privateKeyBuf = Buffer.from(privateKey.slice(2), 'hex');
      const { v, r, s } = ecsign(hex2buf(TSCS_HASH), privateKeyBuf);
      const data = buildABIData(BUYIN_SIG, v, r, s);

      const transaction = new Transaction(privateKey);
      const { hash } = await transaction.send({
        gasLimit: GAS_LIMIT,
        to: contractAddress,
        value: spending,
        data
      });

      console.warn('sent purchase', hash);
      this.setTransaction(hash);
    } catch (error) {
      appStore.addError(error);
      appStore.goto('contribute');
    }
  }

  @action setInfo ({ accounted, received, success }) {
    this.accounted = accounted;
    this.received = received;
    this.success = success;
  }

  @action setTransaction (transaction) {
    this.transaction = transaction;
  }

  /** Poll on new block `this.address` dot balance, until it changes */
  async watchPurchase () {
    blockStore.on('block', this.checkPurchase, this);
    return this.checkPurchase();
  }

  /** Stop polling */
  unwatchPurchase () {
    blockStore.removeListener('block', this.checkPurchase, this);
  }
}

export default new BuyStore();
