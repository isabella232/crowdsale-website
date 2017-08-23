// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const EthereumTx = require('ethereumjs-tx');

const Certifier = require('./contracts/certifier');
const Sale = require('./contracts/sale');
const onfido = require('./onfido');
const store = require('./store');
const ParityConnector = require('./api/parity');
const { buf2hex } = require('./utils');

class QueueConsumer {
  static run (wsUrl, contractAddress) {
    return new QueueConsumer(wsUrl, contractAddress);
  }

  constructor (wsUrl, contractAddress) {
    this._updateLock = false;
    this._connector = new ParityConnector(wsUrl);
    this._sale = new Sale(this._connector, contractAddress);

    this._connector.on('block', () => this.update());
    this._sale.update().then(() => this.init());
  }

  init () {
    this._certifier = new Certifier(this._connector, this._sale.values.certifier);

    store.Onfido.subscribe((href) => this.verify(href));
    console.warn('Started consumer !');
  }

  async verify (href) {
    try {
      const { address, valid } = await onfido.verify(href);

      if (valid) {
        console.warn('certifying', address);
        const tx = await this._certifier.certify(address);

        await this._connector.transactionReceipt(tx);
      }

      store.Onfido.set(address, { pending: false, success: valid });
    } catch (error) {
      console.error(error);
    } finally {
      store.Onfido.remove(href);
    }
  }

  async update () {
    if (this._updateLock) {
      return;
    }

    this._updateLock = true;

    const connector = this._connector;

    let sent = 0;

    await store.Transactions.scan(async (address, tx, required) => {
      const balance = await connector.balance(address);

      if (balance.lt(required)) {
        return;
      }

      const txBuf = Buffer.from(tx.substring(2), 'hex');
      const txObj = new EthereumTx(txBuf);
      const nonce = txObj.nonce.length ? buf2hex(txObj.nonce) : '0x0';

      try {
        const hash = await connector.sendTx(tx);
        const { logs } = await connector.transactionReceipt(hash);

        const buyinLog = this._sale.parse(logs).find((log) => log.event === 'Buyin');

        if (!buyinLog) {
          throw new Error(`Could not find Buyin() event log in ${hash}`);
        }

        const { accepted } = buyinLog.params;

        await store.Transactions.confirm(address, nonce, hash, accepted);
      } catch (err) {
        console.error(err);
        await store.Transactions.reject(address, nonce, err.message);
      }

      sent += 1;
    });

    this._updateLock = false;

    if (sent > 0) {
      console.log(`Sent ${sent} transactions from the queue`);
    }
  }
}

QueueConsumer.run(config.get('nodeWs'), config.get('saleContract'));
