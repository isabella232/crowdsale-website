import BigNumber from 'bignumber.js';
import EthJS from 'ethereumjs-util';
import { action, computed, observable } from 'mobx';

import backend from '../backend';
import picopsBackend from '../picops-backend';

import appStore, { STEPS as APP_STEPS } from './app.store';
import auctionStore from './auction.store';
import blockStore from './block.store';
import buyStore from './buy.store';
import feeStore from './fee.store';
import storage from './storage';
import Logger from '../logger';

const logger = Logger('account-store');

class AccountStore {
  @observable accounted = new BigNumber(0);
  @observable address = '';
  @observable balance = new BigNumber(0);
  @observable certified = null;
  @observable jsonWallet = null;
  @observable paid = null;
  @observable privateKey = '';
  @observable spending = new BigNumber(0);
  @observable unlocking = false;

  constructor () {
    auctionStore.ready(() => {
      this.load();
      this.ready = true;

      if (this._readyCb) {
        const cb = this._readyCb.bind(this);

        this._readyCb = null;
        cb();
      }
    });
  }

  load () {
    const spending = storage.get('spending', auctionStore.DUST_LIMIT);
    const jsonWallet = storage.get('json-wallet');

    this.setSpending(new BigNumber(spending));
    this.setJSONWallet(jsonWallet);
  }

  @computed get missingWei () {
    const { balance, paid, spending } = this;
    const { totalFee } = feeStore;

    let missingWei = spending.add(buyStore.totalGas).sub(balance);

    if (!paid) {
      missingWei = missingWei.add(totalFee);
    }

    if (missingWei.lt(0)) {
      missingWei = new BigNumber(0);
    }

    // logger.warn(JSON.stringify({ balance, missingWei, paid, spending, totalFee }, null, 2));
    return missingWei;
  }

  async checkCertification () {
    const { certified } = await backend.getAddressInfo(this.address);

    if (certified) {
      this.setInfo({ certified });
      this.unwatchCertification();

      // ensure we have enough funds for purchase
      this.checkPayment();
    }
  }

  async checkFeePayment () {
    await this.fetchInfo();

    if (this.paid) {
      this.unwatchFeePayment();
      return this.checkPayment();
    }
  }

  async checkPayment () {
    await this.fetchInfo();

    if (this.missingWei.eq(0)) {
      logger.log('got enough funds');
      this.unwatchPayment();

      if (this.certified) {
        logger.log('certified, sending purchase');
        return buyStore.purchase(this.address, this.spending, this.privateKey);
      }

      if (!this.paid) {
        logger.log('have not paid, sending fee payment');
        return feeStore.sendPayment(this.address, this.privateKey);
      }

      // If not certified but already paid
      logger.log('paid but not certified, going to picops');
      return appStore.goto('picops');
    }

    if (appStore.step !== APP_STEPS['payment']) {
      // Go to payment page if not there already
      appStore.goto('payment');
    }
  }

  async fetchInfo () {
    if (!this.address) {
      throw new Error('no address set in the account store');
    }

    const { accounted, eth: balance, certified } = await backend.getAddressInfo(this.address);

    // No need to fetch paid info again if paid
    if (!this.paid) {
      const { paid } = await picopsBackend.getAccountFeeInfo(this.address);

      this.setInfo({ paid });
    }

    this.setInfo({ accounted, balance, certified });
  }

  /**
   * Check that the given address is certified,
   * if not go to the PICOPS T&Cs
   */
  async gotoContribute () {
    // If there is a callback to call on unlock,
    // call it
    if (this._unlocked) {
      const { resolve } = this._unlocked;

      resolve();
      this._unlocked = null;
      return this.setUnlocking(false);
    }

    const { certified } = await backend.getAddressInfo(this.address);
    const { now, endTime } = auctionStore;

    // Last hour
    if (!certified && endTime - now < 1000 * 3600) {
      return appStore.revertAndGo('late-uncertified');
    }

    if (!certified) {
      return appStore.revertAndGo('picops-terms');
    }

    return appStore.revertAndGo('contribute');
  }

  restart () {
    if (this._unlocked) {
      const { reject } = this._unlocked;

      reject(new Error('Should restart...'));
      this._unlocked = null;
    }

    this.setJSONWallet(null);
    appStore.goto('important-notice');
    storage.reset();
    return this.setUnlocking(false);
  }

  async setAccount ({ address, privateKey }) {
    // Remove JSON wallet if any
    if (this.jsonWallet) {
      this.jsonWallet = null;
    }

    this.address = address;
    this.privateKey = privateKey;

    await this.fetchInfo();
  }

  @action setInfo ({ accounted, balance, certified, paid }) {
    if (accounted !== undefined) {
      this.accounted = accounted;
    }

    if (balance !== undefined) {
      this.balance = balance;
    }

    if (certified !== undefined) {
      this.certified = certified;
    }

    if (paid !== undefined) {
      this.paid = paid;
    }
  }

  @action setJSONWallet (jsonWallet) {
    this.jsonWallet = jsonWallet;
    storage.set('json-wallet', jsonWallet);
  }

  /**
   * Sets how much the user would like to spend,
   * in WEI.
   *
   * @param {BigNumber} spending The value the user wants to send, in WEI
   */
  @action setSpending (spending) {
    this.spending = spending;
    storage.set('spending', '0x' + spending.toString(16));
  }

  /**
   * Sign the given message
   *
   * @param  {String} message
   * @return {String}
   */
  signMessage (message) {
    if (!this.privateKey) {
      throw new Error('no private key found');
    }

    const privateKey = Buffer.from(this.privateKey.slice(2), 'hex');

    const msgHash = EthJS.hashPersonalMessage(EthJS.toBuffer(message));
    const { v, r, s } = EthJS.ecsign(msgHash, privateKey);

    return EthJS.toRpcSig(v, r, s);
  }

  /** Poll on new block if `this.address` is certified */
  async watchCertification () {
    blockStore.on('block', this.checkCertification, this);
    return this.checkCertification();
  }

  /** Poll on new block if `this.address` paid the fee */
  async watchFeePayment () {
    logger.log('watching fee payment');
    blockStore.on('block', this.checkFeePayment, this);
    return this.checkFeePayment();
  }

  /** Poll on new block `this.address` balance, until >= missing ETH */
  async watchPayment () {
    blockStore.on('block', this.checkPayment, this);
    return this.checkPayment();
  }

  /** Stop polling */
  unwatchCertification () {
    blockStore.removeListener('block', this.checkCertification, this);
  }

  /** Stop polling */
  unwatchFeePayment () {
    logger.log('unwatching fee payment');
    blockStore.removeListener('block', this.checkFeePayment, this);
  }

  /** Stop polling */
  unwatchPayment () {
    blockStore.removeListener('block', this.checkPayment, this);
  }

  @action setUnlocking (unlocking) {
    this.unlocking = unlocking;
  }

  unlock () {
    this.setUnlocking(true);

    if (!this.ready) {
      return new Promise((resolve, reject) => {
        this._readyCb = () => {
          this.unlock().then(resolve).catch(reject);
        };
      });
    }

    if (!this.jsonWallet) {
      return Promise.reject(new Error('No wallet file found in storage'));
    }

    return new Promise((resolve, reject) => {
      this._unlocked = { resolve, reject };
      appStore.goto('unlock-account');
    });
  }
}

export default new AccountStore();
