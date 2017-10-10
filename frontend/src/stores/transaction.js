import EthereumTx from 'ethereumjs-tx';
import { privateToAddress } from 'ethereumjs-util';

import backend from '../backend';
import picopsBackend from '../picops-backend';
import config from './config.store';
import { int2hex, isValidAddress } from '../utils';

class Transaction {
  constructor (secret, { picops = false } = {}) {
    const privateKey = Buffer.from(secret.slice(-64), 'hex');
    const sender = '0x' + privateToAddress(privateKey).toString('hex');

    if (!isValidAddress(sender)) {
      throw new Error(`invalid private key: ${secret}`);
    }

    this.sender = sender;
    this.privateKey = privateKey;
    this.picops = picops;
  }

  async send ({ gasLimit, to, value, data }) {
    const nonce = await backend.nonce(this.sender);

    const gasPrice = config.get('gasPrice');
    const chainId = config.get('chainId');

    const txParams = {
      data: data || '0x',
      gasPrice: int2hex(gasPrice),
      gasLimit: int2hex(gasLimit),
      value: int2hex(value),

      chainId,
      nonce,
      to
    };

    console.warn('sending tx', txParams);
    const tx = new EthereumTx(txParams);

    tx.sign(this.privateKey);

    const serializedTx = '0x' + tx.serialize().toString('hex');

    const { hash } = this.picops
      ? await picopsBackend.sendTx(serializedTx)
      : await backend.sendTx(serializedTx);

    return { hash };
  }
}

export default Transaction;
