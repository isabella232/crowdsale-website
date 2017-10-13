import { computed } from 'mobx';

import appStore, { STEPS } from './app.store';
import accountStore from './account.store';

class StepperStore {
  _certified = null;

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

  @computed get title () {
    const { step } = appStore;

    switch (step) {
      case STEPS['important-notice']:
      case STEPS['start']:
      case STEPS['terms']:
      case STEPS['country-selection']:
      case STEPS['account-selection']:
      case STEPS['load-account']:
      case STEPS['unlock-account']:
        this._certified = null;
        return '';

      case STEPS['create-account-password']:
      case STEPS['create-account-recovery']:
      case STEPS['create-account-repeat']:
      case STEPS['create-account-download']:
        this._certified = null;
        return 'GENERATE WALLET';

      case STEPS['contribute']:
      case STEPS['payment']:
      case STEPS['fee-payment']:
      case STEPS['picops']:
      case STEPS['picops-terms']:
      case STEPS['picops-country-selection']:
      case STEPS['purchase']:
        return this.certified
          ? 'SALE CONTRIBUTION'
          : 'IDENTITY CERTIFICATION & SALE CONTRIBUTION';

      case STEPS['summary']:
      case STEPS['late-uncertified']:
        this._certified = null;
        return '';

      default:
        if (step) {
          console.warn('UNKOWN STEP FOR STEPPER', step);
        }

        this._certified = null;
        return '';
    }
  }

  @computed get step () {
    const { step } = appStore;

    switch (step) {
      case STEPS['important-notice']:
      case STEPS['start']:
      case STEPS['terms']:
      case STEPS['country-selection']:
      case STEPS['account-selection']:
      case STEPS['load-account']:
      case STEPS['unlock-account']:
        return -1;

      case STEPS['create-account-password']:
        return 0;
      case STEPS['create-account-recovery']:
      case STEPS['create-account-repeat']:
        return 1;
      case STEPS['create-account-download']:
        return 2;

      case STEPS['picops-terms']:
      case STEPS['picops-country-selection']:
        return this.certified ? -1 : 0;
      case STEPS['contribute']:
        return this.certified ? 0 : 1;
      case STEPS['payment']:
        return this.certified ? 1 : 2;
      case STEPS['fee-payment']:
        return this.certified ? -1 : 3;
      case STEPS['picops']:
        return this.certified ? -1 : 4;
      case STEPS['purchase']:
        return this.certified ? 2 : 5;

      case STEPS['summary']:
      case STEPS['late-uncertified']:
        return -1;

      default:
        if (step) {
          console.warn('UNKOWN STEP FOR STEPPER', step);
        }

        return -1;
    }
  }

  @computed get steps () {
    const { step } = appStore;

    switch (step) {
      case STEPS['important-notice']:
      case STEPS['start']:
      case STEPS['terms']:
      case STEPS['country-selection']:
      case STEPS['account-selection']:
      case STEPS['load-account']:
      case STEPS['unlock-account']:
        return [];

      case STEPS['create-account-password']:
      case STEPS['create-account-recovery']:
      case STEPS['create-account-repeat']:
      case STEPS['create-account-download']:
        return [
          'Choose Password',
          'Recovery Phrase',
          'Generate Wallet'
        ];

      case STEPS['contribute']:
      case STEPS['payment']:
      case STEPS['fee-payment']:
      case STEPS['picops']:
      case STEPS['picops-terms']:
      case STEPS['picops-country-selection']:
      case STEPS['purchase']:
        if (this.certified) {
          return [
            'Select Contribution',
            'Add Ether',
            'Contribute'
          ];
        }

        return [
          'PICOPS T&C',
          'Select Contribution',
          'Add Ether',
          'Fee Payment',
          'PICOPS Certification',
          'Contribute'
        ];

      case STEPS['summary']:
      case STEPS['late-uncertified']:
        return [];

      default:
        if (step) {
          console.warn('UNKOWN STEP FOR STEPPER', step);
        }

        return [];
    }
  }
}

export default new StepperStore();
