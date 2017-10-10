// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Accounts = require('./accounts');
const Auction = require('./auction');
const Chain = require('./chain');
const Config = require('./config');

module.exports = async function set (app, { sale, connector, certifier }) {
  for (const Route of [
    Accounts,
    Auction,
    Chain,
    Config
  ]) {
    const instance = await Route({ sale, connector, certifier });

    app.use(instance.routes(), instance.allowedMethods());
  }
};
