import { computed } from 'mobx';
import store from 'store';

import appStore, { CURRENT_STEP_LS_KEY, STEPS } from './app.store';
import accountStore from './account.store';

const TITLES = {
  generate: 'GENERATE WALLET',
  sale: 'SALE CONTRIBUTION',
  certifAndSale: 'IDENTITY CERTIFICATION & SALE CONTRIBUTION'
};

const CONTRIBUTE_SUBTITLES = {
  choose: 'Select Contribution',
  pay: 'Add Ether',
  buy: 'Contribute'
};

const SUB_TITLES = {
  generate: {
    password: 'Choose Password',
    recovery: 'Recovery Phrase',
    download: 'Generate Wallet'
  },
  certified: CONTRIBUTE_SUBTITLES,
  acertified: {
    terms: 'PICOPS T&Cs',
    choose: CONTRIBUTE_SUBTITLES.choose,
    pay: CONTRIBUTE_SUBTITLES.pay,
    fee: 'Fee Payment',
    picops: 'PICOPS Certification',
    buy: CONTRIBUTE_SUBTITLES.buy
  }
};

const CREATE_ACCOUNT_DEFAULTS = {
  big: 1,
  steps: SUB_TITLES.generate,
  title: TITLES.generate
};

class StepperStore {
  _certified = null;

  constructor () {
    // Show a don't close warning if needed on close
    window.addEventListener('beforeunload', (e) => {
      if (!this.warnOnClose) {
        return;
      }

      const confirmationMessage = 'Are you sure you want to leave this page?';

      // Gecko + IE
      (e || window.event).returnValue = confirmationMessage;
      // Gecko + Webkit, Safari, Chrome etc.
      return confirmationMessage;
    });

    appStore.once('loaded', () => {
      const savedStep = store.get(CURRENT_STEP_LS_KEY);
      const stepData = savedStep ? this.getStepData(STEPS[savedStep]) : null;

      if (!stepData || stepData.invalid || !stepData.saveStep) {
        return appStore.goto('important-notice');
      }

      // Must have an unlocked wallet to continue
      if (stepData.unlock) {
        return accountStore.unlock()
          .then(() => appStore.goto(savedStep))
          .catch((error) => {
            console.error(error);
            return appStore.goto('important-notice');
          });
      }

      return appStore.goto(savedStep);
    });
  }

  /**
   * Store the value of certification,
   * so that the steps and title don't
   * change when the user finally gets certified
   */
  get certified () {
    if (this._certified !== null) {
      return this._certified;
    }

    this._certified = accountStore.certified;
    return this._certified;
  }

  get CONTRIBUTE_DEFAULTS () {
    const { certified } = this;

    const steps = certified ? SUB_TITLES.certified : SUB_TITLES.acertified;
    const title = certified ? TITLES.sale : TITLES.certifAndSale;

    return { big: 2, warnOnClose: true, steps, title, saveStep: true, unlock: true };
  }

  @computed get data () {
    let { big = -1, warnOnClose = false, step = '', saveStep = false, steps = {}, title = '' } = this.getStepData(appStore.step);

    // Delete cached certify if not on contribution step
    if (big !== 2) {
      this._certified = null;
    }

    step = Object.keys(steps).findIndex((k) => k === step);
    steps = Object.keys(steps).map((k) => steps[k]);

    if (saveStep) {
      store.set(CURRENT_STEP_LS_KEY, appStore.stepName);
    }

    return { big, warnOnClose, step, steps, title };
  }

  getStepData (step) {
    switch (step) {
      case STEPS['important-notice']:
      case STEPS['start']:
      case STEPS['terms']:
      case STEPS['country-selection']:
        return { big: 0, saveStep: true };

      case STEPS['account-selection']:
        return { big: 1, saveStep: true };
      case STEPS['load-account']:
      case STEPS['unlock-account']:
        return { big: 1 };

      case STEPS['create-account-password']:
        return Object.assign({ step: 'password' }, CREATE_ACCOUNT_DEFAULTS);
      case STEPS['create-account-recovery']:
      case STEPS['create-account-repeat']:
        return Object.assign({ step: 'recovery' }, CREATE_ACCOUNT_DEFAULTS);
      case STEPS['create-account-download']:
        return Object.assign({ step: 'download' }, CREATE_ACCOUNT_DEFAULTS);

      case STEPS['summary']:
        this._certified = null;
        return { big: 2, saveStep: true, unlock: true };

      case STEPS['late-uncertified']:
        return { big: -1 };

      case STEPS['picops-terms']:
      case STEPS['picops-country-selection']:
        return Object.assign({ step: 'terms' }, this.CONTRIBUTE_DEFAULTS);
      case STEPS['contribute']:
        return Object.assign({ step: 'choose' }, this.CONTRIBUTE_DEFAULTS);
      case STEPS['payment']:
        return Object.assign({ step: 'pay' }, this.CONTRIBUTE_DEFAULTS);
      case STEPS['fee-payment']:
        return Object.assign({ step: 'fee' }, this.CONTRIBUTE_DEFAULTS);
      case STEPS['picops']:
        return Object.assign({ step: 'picops' }, this.CONTRIBUTE_DEFAULTS);
      case STEPS['purchase']:
        return Object.assign({ step: 'buy' }, this.CONTRIBUTE_DEFAULTS);
    }

    if (step) {
      console.warn('UNKOWN STEP FOR STEPPER', step);
    }

    return { invalid: true };
  }

  @computed get big () {
    return this.data.big;
  }

  @computed get warnOnClose () {
    return this.data.warnOnClose;
  }

  @computed get title () {
    return this.data.title;
  }

  @computed get step () {
    return this.data.step;
  }

  @computed get steps () {
    return this.data.steps;
  }
}

export default new StepperStore();
