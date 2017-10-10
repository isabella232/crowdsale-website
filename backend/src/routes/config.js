// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Router = require('koa-router');
const config = require('config');

async function get ({ connector }) {
  const router = new Router({
    prefix: '/api'
  });

  const chainId = await connector.netVersion();
  const gasPrice = config.get('gasPrice');
  const picopsUrl = config.get('picopsUrl');

  router.get('/config', async (ctx, next) => {
    ctx.body = {
      chainId,
      gasPrice,
      picopsUrl
    };
  });

  return router;
}

module.exports = get;
