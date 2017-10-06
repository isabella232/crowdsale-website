// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Router = require('koa-router');

const { hex2big, int2hex, int2date, sleep } = require('../utils');

function get ({ sale, connector }) {
  const router = new Router({
    prefix: '/api/auction'
  });

  router.get('/tx/:hash', async (ctx, next) => {
    const { hash } = ctx.params;

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

  router.get('/chart', async (ctx, next) => {
    const data = await sale.chartData;

    ctx.body = data;
  });

  router.get('/constants', (ctx) => {
    const {
      BONUS_DURATION,
      BONUS_SIZE,
      DIVISOR,
      STATEMENT_HASH,
      beginTime,
      tokenCap
    } = sale.values;

    ctx.body = {
      BONUS_DURATION,
      BONUS_SIZE,
      DIVISOR,
      STATEMENT_HASH,
      beginTime: int2date(beginTime),
      tokenCap
    };
  });

  router.get('/', (ctx) => {
    const extras = {
      block: connector.block,
      connected: connector.status,
      contractAddress: sale.address
    };

    const {
      currentPrice,
      endTime,
      tokensAvailable,
      totalAccounted,
      totalReceived
    } = sale.values;

    ctx.body = Object.assign({}, extras, {
      currentPrice,
      endTime: int2date(endTime),
      tokensAvailable,
      totalAccounted,
      totalReceived
    });
  });

  return router;
}

module.exports = get;
