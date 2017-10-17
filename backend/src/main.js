// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const etag = require('koa-etag');
const cors = require('kcors');

const Certifier = require('./contracts/certifier');
const ParityConnector = require('./api/parity');
const Routes = require('./routes');
const Sale = require('./contracts/sale');
const logger = require('./logger');

const startTime = Date.now();

const app = new Koa();
const { port, hostname } = config.get('http');

const saleContract = config.get('saleContract');

if (!saleContract) {
  logger.error('no sale contract specified');
  process.exit(1);
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});

async function main () {
  const connector = new ParityConnector(config.get('nodeWs'));
  const sale = new Sale(connector, saleContract);

  // Update the sale values on start and new block
  await sale.update();
  connector.on('block', () => sale.update());

  const certifier = new Certifier(connector, sale.values.certifier);

  app.use(async (ctx, next) => {
    ctx.remoteAddress = ctx.req.headers['x-forwarded-for'] || ctx.req.connection.remoteAddress;

    try {
      await next();
    } catch (err) {
      if (err.status) {
        ctx.status = err.status;
        ctx.body = err.message;
      } else {
        ctx.status = 500;
        ctx.body = 'Internal server error';
      }
      ctx.app.emit('error', err, ctx);
    }
  });

  app
    .use(bodyParser())
    .use(cors())
    .use(etag());

  await Routes(app, { sale, connector, certifier });

  app.listen(port, hostname, () => {
    logger.info(`> server started, listening on ${hostname}:${port}`);
    logger.trace(`server took ${(Date.now() - startTime) / 1000}s to start.`);
  });
}
