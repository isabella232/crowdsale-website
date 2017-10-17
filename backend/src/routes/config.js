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
  const etherscan = config.get('etherscan');
  const gasPrice = config.get('gasPrice');
  const picopsUrl = config.get('picopsUrl');
  const saleWebsite = config.get('saleWebsite');

  router.get('/config', async (ctx) => {
    ctx.body = {
      chainId,
      etherscan,
      gasPrice,
      picopsUrl,
      saleWebsite
    };
  });

  return router;
}

module.exports = get;
