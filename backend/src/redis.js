// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient(config.get('redis'));

function errorHandler (err) {
  if (!err) {
    return;
  }

  if (err.code === 'ECONNREFUSED') {
    return console.error(err.message);
  }

  if (err.code === 'NOAUTH') {
    console.error(err.message);
    return process.exit(1);
  }

  if (err instanceof redis.AbortError) {
    console.error('AbortError - the process will exit and should be restarted');
    process.exit(1);
  }

  console.error('Redis error', err);
}

const timeout = setTimeout(() => {
  console.error('Redis is still not ready 5 seconds after startup.');
  process.exit(1);
}, 5000);

client.on('error', (err) => errorHandler(err));
client.on('ready', () => {
  console.warn('Redis is ready!');
  clearTimeout(timeout);
});

client.on('connect', () => console.warn('Redis is connected!'));
client.on('reconnecting', () => console.warn('Redis is reconnecting...'));
client.on('end', () => console.warn('Redis has ended.'));
client.on('warning', (event) => console.warn('Redis send a warning', event));

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
