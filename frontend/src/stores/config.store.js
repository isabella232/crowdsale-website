import EventEmitter from 'eventemitter3';

import backend from '../backend';

/**
 * Configuration stores.
 * Emits a `loaded` event when loaded
 */
class Config extends EventEmitter {
  loaded = false;

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

    Object.keys(conf).forEach((key) => {
      this[key] = conf[key];
    });

    this.loaded = true;
    this.emit('loaded');
  }

  get (key) {
    const value = this[key];

    if (!value) {
      throw new Error(`Could not find key '${key}' in config`);
    }

    return value;
  }
}

export default new Config();
