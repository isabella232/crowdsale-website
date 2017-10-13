import EventEmitter from 'eventemitter3';
import { action, observable } from 'mobx';

import backend from '../backend';

/**
 * Configuration stores.
 * Emits a `loaded` event when loaded
 */
class Config extends EventEmitter {
  loaded = false;

  @observable saleWebsite = '';

  constructor () {
    super();

    this.load().catch((error) => {
      console.error(error);
    });
  }

  async load () {
    if (this.loaded) {
      return;
    }

    const conf = await backend.config();

    this.set(conf);
    this.loaded = true;
    this.emit('loaded');
  }

  @action set (conf) {
    Object.keys(conf).forEach((key) => {
      this[key] = conf[key];
    });
  }

  get (key) {
    const value = this[key];

    if (!value) {
      throw new Error(`Could not find key '${key}' in config`);
    }

    return value;
  }

  ready (cb) {
    if (this.loaded) {
      return cb();
    }

    this.once('loaded', () => cb());
  }
}

export default new Config();
