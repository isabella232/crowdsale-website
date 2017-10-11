import BigNumber from 'bignumber.js';
import EventEmitter from 'eventemitter3';
import { action, computed, observable } from 'mobx';

import backend from '../backend';
import appStore from './app.store';
import blockStore from './block.store';
import { ascii2hex, sha3 } from '../utils';

import rawTerms from '!raw-loader!../terms.md'; // eslint-disable-line import/no-webpack-loader-syntax

function toUTF8 (x) {
  return unescape(encodeURIComponent(x));
}

const tscs = ascii2hex(toUTF8(rawTerms));
const tscsMessage = ascii2hex('\x19Ethereum Signed Message:\n' + (tscs.length / 2 - 1)) + tscs.substr(2);

export const TSCS_HASH = sha3(tscsMessage);

class AuctionStore extends EventEmitter {
  beginTime = new Date();
  contractAddress = '0x';
  tokenCap = new BigNumber(0);

  @observable block = {};
  @observable connected = 'disconnected'
  @observable currentPrice = new BigNumber(0);
  @observable endTime = new Date();
  @observable halted = false;
  @observable tokensAvailable = new BigNumber(0);
  @observable totalAccounted = new BigNumber(0);
  @observable totalReceived = new BigNumber(0);

  constructor () {
    super();
    this.init();
    blockStore.on('block', this.refresh, this);
  }

  async init () {
    const {
      BONUS_LATCH,
      BONUS_MIN_DURATION,
      BONUS_MAX_DURATION,
      DIVISOR,
      STATEMENT_HASH,
      USDWEI,

      beginTime,
      tokenCap,

      contractAddress
    } = await backend.sale();

    this.BONUS_LATCH = BONUS_LATCH;
    this.BONUS_MIN_DURATION = BONUS_MIN_DURATION;
    this.BONUS_MAX_DURATION = BONUS_MAX_DURATION;
    this.DIVISOR = DIVISOR;
    this.USDWEI = USDWEI;

    this.STATEMENT_HASH = STATEMENT_HASH;

    this.beginTime = new Date(beginTime);
    this.tokenCap = new BigNumber(tokenCap);

    this.contractAddress = contractAddress;

    await this.refresh();

    this.emit('loaded');
    this.loaded = true;

    this.checkDummyDeal();

    if (STATEMENT_HASH !== TSCS_HASH) {
      console.warn(`> In contract: ${STATEMENT_HASH} // Computed: ${TSCS_HASH} ...`);
      appStore.addError(new Error(`Unexpected statement hash in the Sale contract.`));
    }
  }

  async checkDummyDeal () {
    const { accounted, refund, price, value } = await backend.dummyDeal();
    const deal = this.theDeal(value);
    const expectedPrice = this.getPrice(this.now);
    const expectedTime = this.getTime(price);

    let error = false;

    if (!deal.accounted.eq(accounted)) {
      error = true;
      console.warn(`mismatch in accounted value: ${deal.accounted.toFormat()} vs. ${accounted.toFormat()}`);
    }

    if (deal.refund !== refund) {
      error = true;
      console.warn(`mismatch in refund value: ${deal.refund} vs. ${refund}`);
    }

    if (!deal.price.eq(price)) {
      error = true;
      console.warn(`mismatch in price value: ${deal.price.toFormat()} vs. ${price.toFormat()}`);
    }

    if (!deal.price.eq(expectedPrice)) {
      error = true;
      console.warn(`mismatch in computed price value: ${deal.price.toFormat()} vs. ${expectedPrice.toFormat()}`);
    }

    if (Math.abs(expectedTime.getTime() - this.now.getTime()) > 1500) {
      error = true;
      console.warn(`mismatch in computed time value: ${this.now} vs. ${expectedTime}`);
    }

    if (!error) {
      console.warn('everything looks good!');
    }
  }

  ready (cb) {
    if (this.loaded) {
      return cb();
    }

    this.once('loaded', () => cb());
  }

  bonus (value) {
    if (!this.isActive()) {
      return new BigNumber(0);
    }

    return value.mul(this.currentBonus).div(100);
  }

  getPrice (_time) {
    if (_time < this.beginTime || _time > this.endTime) {
      return new BigNumber(0);
    }

    const time = new BigNumber(Math.floor(_time.getTime() / 1000));
    const beginTime = new BigNumber(Math.floor(this.beginTime.getTime() / 1000));
    const K = new BigNumber(40000000);
    const { DIVISOR, USDWEI } = this;

    const p1 = USDWEI.mul(K).div(time.sub(beginTime).add(5760)).floor();
    const p2 = USDWEI.mul(5);

    return p1.sub(p2).div(DIVISOR).floor();
  }

  getTarget (time) {
    const price = this.getPrice(time);

    return price.mul(this.DIVISOR).mul(this.tokenCap);
  }

  getTime (price) {
    const beginTime = new BigNumber(Math.floor(this.beginTime.getTime() / 1000));
    const K = new BigNumber(40000000);
    const { DIVISOR, USDWEI } = this;

    const f1 = USDWEI.mul(K).floor();
    const f2 = price.mul(DIVISOR).add(USDWEI.mul(5)).floor();

    const time = beginTime.sub(5760).add(f1.div(f2).floor()).floor();

    return new Date(time.mul(1000).toNumber());
  }

  getTimeFromTarget (target) {
    const price = target.div(this.DIVISOR).div(this.tokenCap);

    return this.getTime(price);
  }

  isActive () {
    return this.now >= this.beginTime && this.now < this.endTime;
  }

  weiToDot (weiValue) {
    const deal = this.theDeal(weiValue);

    if (deal.price.eq(0)) {
      return new BigNumber(0);
    }

    const dots = deal.accounted.div(deal.price).floor();

    return dots.div(this.DIVISOR);
  }

  theDeal (value) {
    let accounted = new BigNumber(0);
    let refund = false;

    const bonus = this.bonus(value);
    const price = this.currentPrice;

    if (!this.isActive() || !value) {
      return {
        accounted,
        refund,
        price
      };
    }

    accounted = value.add(bonus).floor();

    const available = this.tokensAvailable;
    const tokens = accounted.div(price).floor();

    refund = (tokens.gt(available));

    return {
      accounted,
      refund,
      price
    };
  }

  @computed
  get beginPrice () {
    return this.getPrice(this.beginTime);
  }

  @computed
  get endPrice () {
    return this.getPrice(this.endTime);
  }

  @computed
  get now () {
    if (!this.block || !this.block.timestamp) {
      return new Date(0);
    }

    return new Date(this.block.timestamp);
  }

  async refresh () {
    try {
      const status = await backend.status();

      this.update(status);
    } catch (error) {
      console.error(error);
    }
  }

  @action
  update (status) {
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
    } = status;

    if (block && block.number) {
      block.number = new BigNumber(block.number);
    }

    this.currentBonus = currentBonus;
    this.currentPrice = currentPrice;
    this.endTime = endTime;
    this.halted = halted;
    this.tokensAvailable = tokensAvailable;
    this.totalAccounted = totalAccounted;
    this.totalReceived = totalReceived;

    this.block = block;
    this.connected = connected;
  }
}

export default new AuctionStore();
