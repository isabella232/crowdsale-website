// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const redis = require('../src/redis');

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main () {
  const results = await redis.keys('*');

  console.log(`Found ${results.length} keys in Redis...`);
  process.exit(0);
}
