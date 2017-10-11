import { countries } from 'country-data';
import EventEmitter from 'eventemitter3';
import { difference, uniq } from 'lodash';
import { action, computed, observable } from 'mobx';
import store from 'store';
// import History from 'history.js';

import backend from '../backend';
import config from './config.store';

export const CITIZENSHIP_LS_KEY = '_parity-crowdsale::citizenship';
export const TERMS_LS_KEY = '_parity-crowdsale::agreed-terms::v1';

// Messages displays for 15s
const MESSAGE_TIMELIFE = 1000 * 15;

export const STEPS = {
  'important-notice': Symbol('important notice'),
  'start': Symbol('start'),
  'terms': Symbol('terms'),
  'country-selection': Symbol('country selection'),

  'account-selection': Symbol('account selection'),
  'load-account': Symbol('load account'),
  'unlock-account': Symbol('unlock account'),
  'create-account-password': Symbol('create-account-password'),
  'create-account-recovery': Symbol('create-account-recovery'),
  'create-account-repeat': Symbol('create-account-repeat'),
  'create-account-download': Symbol('create-account-download'),

  'picops-terms': Symbol('picops terms and conditions'),
  'contribute': Symbol('contribute'),
  'payment': Symbol('payment'),
  'picops': Symbol('picops'),
  'fee-payment': Symbol('fee payment'),
  'purchase': Symbol('purchase'),
  'summary': Symbol('summary'),
  'late-uncertified': Symbol('late-uncertified')
};

let nextErrorId = 1;

class AppStore extends EventEmitter {
  blacklistedCountries = [];
  certifierAddress = null;
  loaders = {};

  skipCountrySelection = false;

  @observable loading = true;
  @observable messages = {};
  @observable step;
  @observable citizenAccepted = false;
  @observable spendingAccepted = false;
  @observable termsAccepted = false;

  @computed get stepper () {
    switch (this.step) {
      case STEPS['important-notice']:
      case STEPS['start']:
      case STEPS['terms']:
      case STEPS['country-selection']:
        return 0;

      case STEPS['account-selection']:
      case STEPS['load-account']:
      case STEPS['unlock-account']:
      case STEPS['create-account-password']:
      case STEPS['create-account-recovery']:
      case STEPS['create-account-repeat']:
      case STEPS['create-account-download']:
        return 1;

      case STEPS['contribute']:
      case STEPS['payment']:
      case STEPS['fee-payment']:
      case STEPS['picops']:
      case STEPS['picops-terms']:
      case STEPS['purchase']:
      case STEPS['summary']:
        return 2;

      case STEPS['late-uncertified']:
        return -1;

      default:
        if (this.step) {
          console.warn('UNKOWN STEP FOR STEPPER', this.step);
        }

        return 0;
    }
  }

  constructor () {
    super();
    this.load();
  }

  load = async () => {
    try {
      await config.load();
      this.certifierAddress = await backend.certifierAddress();
      await this.loadCountries();
    } catch (error) {
      this.addError(error);
    }

    this.goto('important-notice');
  };

  async goto (name) {
    if (!STEPS[name]) {
      throw new Error(`unknown step ${name}`);
    }

    this.setLoading(true);
    this.setStep(STEPS[name]);

    // Trigger the loaders and wait for them to return
    if (this.loaders[name]) {
      for (let loader of this.loaders[name]) {
        // A loader can return a truthy value to
        // skip further loadings
        const skip = await loader();

        if (skip) {
          return;
        }
      }
    }

    this.setLoading(false);
  }

  async fetchBlacklistedCountries () {
    return Promise.resolve(['USA', 'CHN']);
  }

  async loadCountries () {
    const blCountries = await this.fetchBlacklistedCountries();

    this.blacklistedCountries = blCountries
      .filter((countryKey) => {
        if (!countries[countryKey]) {
          console.error(new Error('unknown country key: ' + countryKey));
          return false;
        }

        return true;
      });

    const prevCountries = store.get(CITIZENSHIP_LS_KEY) || [];

    // The country selection can be skipped if the user
    // already said he was not from on of the
    // current blacklisted countries
    this.skipCountrySelection = difference(
      this.blacklistedCountries,
      prevCountries
    ).length === 0;
  }

  register (step, loader) {
    if (!STEPS[step]) {
      throw new Error(`unknown step ${step}`);
    }

    this.loaders[step] = (this.loaders[step] || []).concat(loader);
  }

  restart () {
    store.remove(CITIZENSHIP_LS_KEY);
    store.remove(TERMS_LS_KEY);

    this.termsAccepted = false;

    this.emit('restart');
    this.goto('start');
  }

  addError (error) {
    if (!error) {
      return console.error('no error given....', error);
    }

    console.error(error);
    return this.addMessage({ content: error.message, type: 'error', title: 'An error occured' });
  }

  @action addMessage ({ title, content, type }) {
    const id = nextErrorId++;

    this.messages = Object.assign({}, this.messages, { [id]: { title, content, type, id } });

    setTimeout(() => this.removeMessage(id), MESSAGE_TIMELIFE);

    return id;
  }

  @action removeMessage (id) {
    const messages = Object.assign({}, this.messages);

    if (messages[id]) {
      delete messages[id];
      this.messages = messages;
    }
  }

  @action setCitizenChecked (citizenAccepted) {
    this.citizenAccepted = citizenAccepted;
  }

  @action setLoading (loading) {
    this.loading = loading;
  }

  @action setSpendingChecked (spendingAccepted) {
    this.spendingAccepted = spendingAccepted;
  }

  @action setTermsAccepted (termsAccepted) {
    this.termsAccepted = termsAccepted;
  }

  @action setStep (step) {
    this.step = step;
  }

  storeValidCitizenship () {
    const prevState = store.get(CITIZENSHIP_LS_KEY) || [];
    const nextState = uniq(prevState.concat(this.blacklistedCountries));

    store.set(CITIZENSHIP_LS_KEY, nextState);
  }

  storeTermsAccepted () {
    store.set(TERMS_LS_KEY, this.termsAccepted);
  }
}

const appStore = new AppStore();

// History.Adapter.bind(window, 'statechange', () => {
//   const State = History.getState();

//   console.warn(State);
// });

// window.appStore = appStore;
export default appStore;
