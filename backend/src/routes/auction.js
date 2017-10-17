// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Router = require('koa-router');
const querystring = require('querystring');

const { error: errorHandler } = require('./utils');
const { int2hex, int2date, isValidHex } = require('../utils');

function get ({ sale, connector }) {
  const router = new Router({
    prefix: '/api'
  });

  router.get('/auction/tx/:hash', async (ctx) => {
    const { hash } = ctx.params;

    if (!isValidHex(hash)) {
      return errorHandler(ctx, 400, 'Invalid transaction hash');
    }

    const transaction = await connector.getTx(hash);

    // Wait for one block
    if (!transaction || !transaction.blockNumber) {
      ctx.body = { status: 'unkown' };
      return;
    }

    // Make sure the transaction was sent to the
    // sale contract
    if (transaction.to !== sale.address) {
      ctx.body = { status: 'invalid' };
      return;
    }

    const receipt = await connector.getTxReceipt(hash);

    if (!receipt) {
      ctx.body = { status: 'unkown' };
      return;
    }

    const { logs } = receipt;
    const parsed = sale.parse(logs);
    const buyin = parsed.find((log) => log.event === 'Buyin');

    // If `Buyin` log, something went wrong
    if (!buyin) {
      ctx.body = { status: 'failed' };
      return;
    }

    const { accounted, received, price, who } = buyin.params;

    ctx.body = {
      status: 'success',
      who: who,

      accounted: int2hex(accounted),
      received: int2hex(received),
      price: int2hex(price)
    };
  });

  router.get('/auction/chart', async (ctx) => {
    const { since } = querystring.parse(ctx.querystring);
    const data = sale.chart;

    if (!since) {
      ctx.body = data;
      return;
    }

    const time = parseInt(since);
    const date = new Date(Number.isNaN(time) || time.toString() !== since ? since : time);

    if (isNaN(date.getTime())) {
      return errorHandler(ctx, 400, 'Invalid date');
    }

    ctx.body = data.filter((datum) => datum.time > date);
  });

  router.get('/auction/dummy-deal', async (ctx) => {
    const { accounted, refund, price, value } = await sale.dummyDeal();

    ctx.body = {
      accounted: int2hex(accounted),
      price: int2hex(price),
      value: int2hex(value),

      refund
    };
  });

  router.get('/auction/constants', (ctx) => {
    const {
      DUST_LIMIT,
      STATEMENT_HASH,
      BONUS_LATCH,
      BONUS_MIN_DURATION,
      BONUS_MAX_DURATION,
      USDWEI,
      DIVISOR,

      admin,
      beginTime,
      certifier,
      tokenCap,
      tokenContract,
      treasury
    } = sale.values;

    ctx.body = {
      DUST_LIMIT: int2hex(DUST_LIMIT),
      STATEMENT_HASH,
      BONUS_LATCH: int2hex(BONUS_LATCH),
      BONUS_MIN_DURATION: int2hex(BONUS_MIN_DURATION),
      BONUS_MAX_DURATION: int2hex(BONUS_MAX_DURATION),
      USDWEI: int2hex(USDWEI),
      DIVISOR: int2hex(DIVISOR),

      admin,
      beginTime: int2date(beginTime),
      certifier,
      tokenCap: int2hex(tokenCap),
      tokenContract,
      treasury,

      contractAddress: sale.address
    };
  });

  router.get('/auction', (ctx) => {
    const extras = {
      block: connector.block,
      connected: connector.status
    };

    const {
      currentBonus,
      currentPrice,
      endPrice,
      endTime,
      halted,
      lastNewInterest,
      maxPurchase,
      tokensAvailable,
      totalAccounted,
      totalFinalised,
      totalReceived
    } = sale.values;

    ctx.body = Object.assign({}, extras, {
      currentBonus: int2hex(currentBonus),
      currentPrice: int2hex(currentPrice),
      endPrice: int2hex(endPrice),
      endTime: int2date(endTime),
      halted,
      lastNewInterest: int2hex(lastNewInterest),
      maxPurchase: int2hex(maxPurchase),
      tokensAvailable: int2hex(tokensAvailable),
      totalAccounted: int2hex(totalAccounted),
      totalFinalised: int2hex(totalFinalised),
      totalReceived: int2hex(totalReceived)
    });
  });

  router.get('/sale', (ctx) => {
    const {
      currentBonus,
      currentPrice,
      endTime,
      halted,
      tokensAvailable,
      totalAccounted,
      totalFinalised,
      totalReceived
    } = sale.values;

    ctx.body = {
      currentBonus: int2hex(currentBonus),
      currentPrice: int2hex(currentPrice),
      endTime: int2date(endTime),
      halted,
      tokensAvailable: int2hex(tokensAvailable),
      totalAccounted: int2hex(totalAccounted),
      totalFinalised: int2hex(totalFinalised),
      totalReceived: int2hex(totalReceived)
    };
  });

  return router;
}

module.exports = get;
