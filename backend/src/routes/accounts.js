// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Router = require('koa-router');

const { rateLimiter } = require('./utils');

function get ({ sale, connector, certifier }) {
  const router = new Router({
    prefix: '/api/accounts'
  });

  router.get('/:address', async (ctx, next) => {
    const { address } = ctx.params;

    await rateLimiter(address, ctx.remoteAddress);

    const [ eth, [ accounted ], certified ] = await Promise.all([
      connector.balance(address),
      sale.methods.buyins(address).get(),
      certifier.isCertified(address)
    ]);

    ctx.body = {
      certified,
      eth: '0x' + eth.toString(16),
      accounted: '0x' + accounted.toString(16)
    };
  });

  router.get('/:address/nonce', async (ctx, next) => {
    const { address } = ctx.params;

    await rateLimiter(address, ctx.remoteAddress);

    const nonce = await connector.nextNonce(address);

    ctx.body = { nonce };
  });

  return router;
}

module.exports = get;
