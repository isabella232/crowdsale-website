// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

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

    const [ eth, [ accounted ], certified ] = await Promise.all([
      connector.balance(address),
      sale.methods.buyins(address).get(),
      certifier.isCertified(address)
    ]);

    ctx.body = {
      certified,
      eth: int2hex(eth),
      accounted: int2hex(accounted)
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
