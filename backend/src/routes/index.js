// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Accounts = require('./accounts');
const Auction = require('./auction');
const Chain = require('./chain');
const Config = require('./config');

module.exports = async function set (app, { sale, connector, certifier }) {
  const promises = [
    Accounts,
    Auction,
    Chain,
    Config
  ].map(async (Route) => {
    const instance = await Route({ sale, connector, certifier });

    app.use(instance.routes(), instance.allowedMethods());
  });

  await Promise.all(promises);
};
