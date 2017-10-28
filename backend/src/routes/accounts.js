// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const BigNumber = require('bignumber.js');
const Router = require('koa-router');

const { error: errorHandler, rateLimiter } = require('./utils');
const { int2hex, isValidAddress } = require('../utils');

function get ({ sale, connector, certifier }) {
  const router = new Router({
    prefix: '/api/accounts'
  });

  router.get('/:address', async (ctx) => {
    const { address } = ctx.params;

    if (!isValidAddress(address)) {
      return errorHandler(ctx, 400, 'Invalid address');
    }

    await rateLimiter(address, ctx.remoteAddress);

    const [ eth, [ accounted, received ], certified ] = await Promise.all([
      connector.balance(address),
      sale.methods.buyins(address).get(),
      certifier.isCertified(address)
    ]);

    ctx.body = {
      certified,
      eth: int2hex(eth),
      accounted: int2hex(accounted),
      received: int2hex(received)
    };
  });

  router.get('/:address/allocation', async (ctx) => {
    const { address } = ctx.params;

    if (!isValidAddress(address)) {
      return errorHandler(ctx, 400, 'Invalid address');
    }

    await rateLimiter(address, ctx.remoteAddress);

    const { currentPrice, endPrice } = sale.values;
    const price = currentPrice.gt(0)
      ? currentPrice
      : endPrice;

    let [ accounted, received ] = await sale.methods.buyins(address).get();
    let balance;

    if (accounted.gt(0)) {
      balance = accounted.div(price).floor();
    } else {
      const logs = await sale.logs([
        'Buyin',
        'Injected'
      ], {
        fromBlock: sale.minedBlock,
        topics: [ [ '0x' + address.slice(-40).padStart(64, 0) ] ]
      });

      accounted = logs.reduce((result, log) => result.add(log.params.accounted || 0), new BigNumber(0));
      received = logs.reduce((result, log) => result.add(log.params.received || 0), new BigNumber(0));

      [ balance ] = await sale.frozenToken.methods.balanceOf(address).get();
    }

    const bonus = accounted.div(received).sub(1);

    ctx.body = {
      dots: int2hex(balance),
      bonus,
      accounted: int2hex(accounted),
      received: int2hex(received),
      price: int2hex(price)
    };
  });

  router.get('/:address/balance', async (ctx) => {
    const { address } = ctx.params;

    if (!isValidAddress(address)) {
      return errorHandler(ctx, 400, 'Invalid address');
    }

    await rateLimiter(address, ctx.remoteAddress);

    const balance = await connector.balance(address);

    ctx.body = {
      balance: int2hex(balance)
    };
  });

  router.get('/:address/nonce', async (ctx) => {
    const { address } = ctx.params;

    if (!isValidAddress(address)) {
      return errorHandler(ctx, 400, 'Invalid address');
    }

    await rateLimiter(address, ctx.remoteAddress);

    const nonce = await connector.nextNonce(address);

    ctx.body = { nonce };
  });

  return router;
}

module.exports = get;
