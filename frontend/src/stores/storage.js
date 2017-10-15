import store from 'store';

export const STORAGE_LS_KEY = 'parity-crowdsale::data';

class Storage {
  get (key, dflt = null) {
    const data = store.get(STORAGE_LS_KEY, {});
    const value = data[key];

    return value === undefined ? dflt : value;
  }

  set (key, value) {
    const prevData = store.get(STORAGE_LS_KEY, {});
    const nextData = Object.assign({}, prevData, { [key]: value });

    store.set(STORAGE_LS_KEY, nextData);
  }

  reset () {
    store.remove(STORAGE_LS_KEY);
  }
}

export default new Storage();
