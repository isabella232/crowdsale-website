// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const redis = require('redis');
const { promisify } = require('util');

const logger = require('./logger');

const client = redis.createClient(config.get('redis'));

function errorHandler (err) {
  if (!err) {
    return;
  }

  if (err.code === 'ECONNREFUSED') {
    return logger.error(err.message);
  }

  if (err.code === 'NOAUTH') {
    logger.error(err.message);
    return process.exit(1);
  }

  if (err instanceof redis.AbortError) {
    logger.error('AbortError - the process will exit and should be restarted');
    process.exit(1);
  }

  logger.error('Redis error', err);
}

const timeout = setTimeout(() => {
  logger.error('Redis is still not ready 5 seconds after startup.');
  process.exit(1);
}, 5000);

client.on('error', (err) => errorHandler(err));
client.on('ready', () => {
  logger.info('Redis is ready!');
  clearTimeout(timeout);
});

client.on('connect', () => logger.info('Redis is connected!'));
client.on('reconnecting', () => logger.warn('Redis is reconnecting...'));
client.on('end', () => logger.warn('Redis has ended.'));
client.on('warning', (event) => logger.warn('Redis send a warning', event));

// Promisfy & export required Redis commands
for (const func of [
  // Transactions
  'multi', 'exec', 'discard',
  // Plain keys
  'keys', 'del', 'get', 'set', 'incr',
  // Hashes
  'hget', 'hgetall', 'hset', 'hdel', 'hscan', 'hlen', 'hexists', 'hvals',
  // Sets
  'sadd', 'spop', 'smembers', 'sscan', 'srem', 'sismember', 'scard', 'psetex',
  // Pubsub
  'publish', 'subscribe',
  // Keys
  'exists',
  // Expires
  'pexpire'
]) {
  exports[func] = promisify(client[func].bind(client));
}

exports.client = client;
exports.errorHandler = errorHandler;
