import React, { Component } from 'react';

import IFrame from '../ui/IFrame';
import picopsBackend from '../../picops-backend';
import accountStore from '../../stores/account.store';

export default class Picops extends Component {
  render () {
    const { address } = accountStore;

    return (
      <IFrame
        onMessage={this.handleMessage}
        src={`${picopsBackend.baseUrl}/?no-padding&no-stepper&terms-accepted&no-final-screen&paid-for=${address}`}
      />
    );
  }

  handleMessage = (event, message) => {
    if (message.action === 'request-signature') {
      console.warn('requesting to sign', message.data);
      this.handleSignMessage(message.data, event.source, event.origin);
    }

    if (message.action === 'certified') {
      accountStore.checkPayment();
    }
  };

  handleSignMessage = (message, source, origin) => {
    const signature = accountStore.signMessage(message);

    console.warn('sending signature', message, signature);
    source.postMessage(JSON.stringify({
      action: 'signature',
      signature
    }), origin);
  };
}
