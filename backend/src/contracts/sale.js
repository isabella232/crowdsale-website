// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const BigNumber = require('bignumber.js');
const config = require('config');
const { uniq } = require('lodash');

const { SecondPriceAuction } = require('../abis');
const Contract = require('../api/contract');
const logger = require('../logger');
const { int2date, int2hex, fromWei } = require('../utils');

const saleMinedBlock = config.get('saleMinedBlock');

const STATICS = [
  'DUST_LIMIT',
  'STATEMENT_HASH',
  'BONUS_LATCH',
  'BONUS_MIN_DURATION',
  'BONUS_MAX_DURATION',
  'USDWEI',
  'DIVISOR',

  'admin',
  'beginTime',
  'certifier',
  'tokenCap',
  'tokenContract',
  'treasury'
];

class Sale extends Contract {
  /**
   * Abstraction over the sale contract, found here:
   * https://github.com/paritytech/second-price-auction/blob/master/src/contracts/SecondPriceAuction.sol
   *
   * @param {Object} connector  A ParityConnector
   * @param {String} address    `0x` prefixed
   */
  constructor (connector, address) {
    super(connector, address, SecondPriceAuction, STATICS);

    this._saleLogs = [];
    this._chart = [];
    this.init();
  }

  async dummyDeal () {
    const value = new BigNumber(Math.pow(10, 16));
    const [ accounted, refund, price ] = await this.methods.theDeal(value).get();

    return { accounted, refund, price, value };
  }

  async init () {
    try {
      await this.fetchLogs();

      // Re-fetch the logs every 15 minutes
      setInterval(() => this.fetchLogs(), 1000 * 60 * 15);
    } catch (error) {
      logger.error(error);
    }
  }

  async update () {
    try {
      await super.update();
      // logger.trace(`Price is ${this.values.currentPrice.toFormat()} wei`);
    } catch (err) {
      logger.error(err);
    }
  }

  get chart () {
    return this._chart;
  }

  get saleLogs () {
    return this._saleLogs;
  }

  checkLogs () {
    if (this.saleLogs.length < 1) {
      return;
    }

    const lastLogValue = fromWei(this.saleLogs.slice(-1)[0].totalAccounted);
    const currentValue = fromWei(this.values.totalAccounted);

    if (!lastLogValue.eq(currentValue)) {
      logger.warn(`Invalid log values have been found! { last: ${lastLogValue.toFormat(3)}, current: ${currentValue.toFormat(3)} }`);
    }
  }

  async fetchLogs () {
    if (!this.values.beginTime) {
      await this.update();
    }

    if (this.subId) {
      this.unsubscribe(this.subId);
      this.subId = null;
    }

    const startTime = Date.now();
    const logs = await this.logs([
      'Buyin',
      'Injected'
    ], { fromBlock: saleMinedBlock });

    logger.trace(`took ${(Date.now() - startTime) / 1000}s to fetch ${logs.length} logs`);
    await this.addLogs(logs, { init: true });

    this.subId = await this.subscribe([ 'Buyin', 'Injected' ], async (sLogs) => {
      logger.trace(`got ${sLogs.length} new logs!`);
      await this.addLogs(sLogs);
    });
  }

  async addLogs (logs, { init = false } = {}) {
    const fLogs = await this.formatLogs(logs, { init });

    // Sort logs in ASC time
    const nextLogs = [].concat(this.saleLogs, fLogs);

    // Link to each block the log with the highest amount
    const logPerBlock = nextLogs
      .reduce((data, log) => {
        const key = log.blockNumber;

        // only take the log with the highest value
        if (!data[key] || data[key].totalAccounted.lt(log.totalAccounted)) {
          data[key] = log;
        }

        return data;
      }, {});

    // Sort logs in ASC time
    this._saleLogs = Object.values(logPerBlock)
      .sort((logA, logB) => logA.time - logB.time);

    const beginTime = new Date(this.values.beginTime.mul(1000).toNumber());

    const firstSaleLogIndex = this.saleLogs.findIndex((log) => log.time >= beginTime);
    // Create a fake log for the beginning of the sale
    const startSaleLogs = firstSaleLogIndex >= 0
      ? {
        time: new Date(beginTime.getTime() - 500),
        totalAccounted: int2hex(this.saleLogs[firstSaleLogIndex - 1].totalAccounted)
      }
      : null;

    const nextChart = this.saleLogs
      .filter((log) => log.time >= beginTime)
      .map((log) => ({
        totalAccounted: int2hex(log.totalAccounted),
        time: log.time
      }));

    this._chart = startSaleLogs
      ? [ startSaleLogs ].concat(nextChart)
      : nextChart;

    // Check if logs are correct
    this.checkLogs();
  }

  async formatLogs (logs, { init = false } = {}) {
    try {
      const blockNumbers = uniq(logs.map((log) => log.blockNumber));
      const blocks = await Promise.all(blockNumbers.map((bn) => this.connector.getBlock(bn)));

      logs.forEach((log) => {
        const bnIndex = blockNumbers.indexOf(log.blockNumber);
        const block = blocks[bnIndex];

        log.timestamp = int2date(block.timestamp);
      });

      // Get the last total accounted value known
      let totalAccounted = !init && this.saleLogs.length > 0
        ? new BigNumber(this.saleLogs.slice(-1)[0].totalAccounted)
        : new BigNumber(0);

      // Sort logs per block, and tx index
      const sortedLogs = logs
        .sort((logA, logB) => {
          const bnA = new BigNumber(logA.blockNumber);
          const bnB = new BigNumber(logB.blockNumber);
          const bnDiff = bnA.sub(bnB);

          if (!bnDiff.eq(0)) {
            return bnDiff.toNumber();
          }

          const tidxA = new BigNumber(logA.transactionIndex);
          const tidxB = new BigNumber(logB.transactionIndex);

          return tidxA.sub(tidxB);
        });

      return sortedLogs
        .map((log) => {
          const { accounted } = log.params;

          totalAccounted = totalAccounted.add(accounted);

          return {
            totalAccounted: totalAccounted.plus(0),
            blockNumber: log.blockNumber,
            time: log.timestamp
          };
        });
    } catch (error) {
      logger.error(error);
      return [];
    }
  }
}

module.exports = Sale;
